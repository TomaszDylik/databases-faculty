const prisma             = require('../prisma/client');
const incidentRepository = require('../repositories/incidentRepository');
const heroRepository     = require('../repositories/heroRepository');
const profileService     = require('./profileService');
const { BadRequestError, ValidationError, NotFoundError, ConflictError, ForbiddenError } = require('./errors');

const VALID_LEVELS   = ['low', 'medium', 'critical'];
const VALID_STATUSES = ['open', 'assigned', 'resolved'];
const CRITICAL_REQUIRED_POWERS = ['flight', 'strength'];

function validateIncidentId(id) {
  if (!Number.isInteger(id) || id < 1)
    throw new ValidationError('Incident id must be a positive integer');
}

async function listIncidents({ level, status, district, categoryId, exclude, page, pageSize } = {}) {
  if (level  && !VALID_LEVELS.includes(level))
    throw new ValidationError(`Invalid level "${level}". Allowed: ${VALID_LEVELS.join(', ')}`);
  if (status && !VALID_STATUSES.includes(status))
    throw new ValidationError(`Invalid status "${status}". Allowed: ${VALID_STATUSES.join(', ')}`);
  if (page     !== undefined && (!Number.isInteger(page)     || page < 1))
    throw new ValidationError('Query parameter "page" must be a positive integer');
  if (pageSize !== undefined && (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50))
    throw new ValidationError('Query parameter "pageSize" must be an integer between 1 and 50');
  return incidentRepository.findAll({ level, status, district, categoryId, exclude, page, pageSize });
}

async function getIncidentById(incidentId) {
  validateIncidentId(incidentId);
  const incident = await incidentRepository.findById(incidentId);
  if (!incident) throw new NotFoundError(`Incident with id ${incidentId} not found`);
  return incident;
}

async function createIncident({ location, level, categoryIds }) {
  if (!location || !level) throw new BadRequestError('Fields "location" and "level" are required');
  if (!VALID_LEVELS.includes(level))
    throw new ValidationError(`Level must be one of: ${VALID_LEVELS.join(', ')}`);

  let validatedCategoryIds = [];
  if (categoryIds !== undefined) {
    if (!Array.isArray(categoryIds))
      throw new ValidationError('Field "categoryIds" must be an array of integers');
    validatedCategoryIds = categoryIds.filter((id) => Number.isInteger(id) && id > 0);
  }

  return incidentRepository.create({ location, level, categoryIds: validatedCategoryIds });
}

async function assignHero(incidentId, heroId) {
  validateIncidentId(incidentId);
  if (heroId === undefined || heroId === null)
    throw new BadRequestError('Field "heroId" is required');
  if (!Number.isInteger(heroId) || heroId < 1)
    throw new ValidationError('Hero id must be a positive integer');

  return prisma.$transaction(async (tx) => {
    const incident = await incidentRepository.findByIdWithTx(incidentId, tx);
    if (!incident) throw new NotFoundError(`Incident with id ${incidentId} not found`);
    if (incident.status !== 'open') throw new ConflictError(`Incident is already ${incident.status}`);

    const hero = await heroRepository.findByIdWithTx(heroId, tx);
    if (!hero) throw new NotFoundError(`Hero with id ${heroId} not found`);
    if (hero.status !== 'available') throw new ConflictError('Hero is already busy');

    if (incident.level === 'critical' && !CRITICAL_REQUIRED_POWERS.includes(hero.power))
      throw new ForbiddenError(
        `Critical incidents require flight or strength. Hero "${hero.name}" has ${hero.power}`
      );

    const updated = await incidentRepository.assignHeroWithTx(incidentId, heroId, tx);
    await heroRepository.updateStatus(heroId, 'busy', tx);
    return updated;
  });
}

async function resolveIncident(incidentId) {
  validateIncidentId(incidentId);

  // Prisma $transaction — commit lub rollback obu operacji PG atomowo
  const resolved = await prisma.$transaction(async (tx) => {
    const incident = await incidentRepository.findByIdWithTx(incidentId, tx);
    if (!incident) throw new NotFoundError(`Incident with id ${incidentId} not found`);
    if (incident.status === 'resolved') throw new ConflictError('Incident is already resolved');
    if (incident.status !== 'assigned') throw new ConflictError('Only assigned incidents can be resolved');

    let resolutionMinutes = null;
    if (incident.assignedAt) {
      const ms = Date.now() - new Date(incident.assignedAt).getTime();
      resolutionMinutes = Number((ms / 60_000).toFixed(2));
    }

    const result = await incidentRepository.resolveWithTx(incidentId, resolutionMinutes, tx);

    if (incident.heroId) {
      // jawna inkrementacja — brak afterUpdate, rollback cofa obie operacje
      await tx.hero.update({
        where: { id: incident.heroId },
        data:  { status: 'available', missionsCount: { increment: 1 } },
      });
    }

    return result;
  });

  // Po commicie transakcji Prisma — aktualizacja profilu w MongoDB
  // Błąd tutaj nie cofa PG (intencjonalne — zapis do MongoDB jest best-effort)
  if (resolved.heroId) {
    await profileService.updateProfileAfterResolve(resolved.heroId, resolved);
  }

  return resolved;
}

module.exports = { listIncidents, getIncidentById, createIncident, assignHero, resolveIncident };
