const knex = require('../db/knex');
const incidentRepository = require('../repositories/incidentRepository');
const heroRepository = require('../repositories/heroRepository');
const { BadRequestError, ValidationError, NotFoundError, ConflictError, ForbiddenError } = require('./errors');

const VALID_LEVELS = ['low', 'medium', 'critical'];
const VALID_STATUSES = ['open', 'assigned', 'resolved'];

//Powers that qualify a hero for a CRITICAL-level incident.

const CRITICAL_REQUIRED_POWERS = ['flight', 'strength'];

//Returns incidents, optionally filtered by level and/or status.

async function listIncidents({ level, status, district, page, pageSize } = {}) {
  if (level && !VALID_LEVELS.includes(level)) {
    throw new ValidationError(`Invalid level value "${level}". Allowed: ${VALID_LEVELS.join(', ')}`);
  }
  if (status && !VALID_STATUSES.includes(status)) {
    throw new ValidationError(`Invalid status value "${status}". Allowed: ${VALID_STATUSES.join(', ')}`);
  }
  if (page !== undefined && (!Number.isInteger(page) || page < 1)) {
    throw new ValidationError('Query parameter "page" must be a positive integer');
  }
  if (pageSize !== undefined && (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50)) {
    throw new ValidationError('Query parameter "pageSize" must be an integer between 1 and 50');
  }
  return incidentRepository.findAll({ level, status, district, page, pageSize });
}

//Reports a new incident.

async function createIncident({ location, level }) {
  if (!location || !level) {
    throw new BadRequestError('Fields "location" and "level" are required');
  }
  if (!VALID_LEVELS.includes(level)) {
    throw new ValidationError(`Level must be one of: ${VALID_LEVELS.join(', ')}`);
  }
  return incidentRepository.create({ location, level });
}

//Assigns a hero to an open incident.

async function assignHero(incidentId, heroId) {
  if (heroId === undefined || heroId === null) {
    throw new BadRequestError('Field "heroId" is required');
  }

  return knex.transaction(async (trx) => {
    const incident = await incidentRepository.findByIdForUpdate(trx, incidentId);
    if (!incident) {
      throw new NotFoundError(`Incident with id ${incidentId} not found`);
    }
    if (incident.status !== 'open') {
      throw new ConflictError(`Incident is already ${incident.status}`);
    }

    const hero = await heroRepository.findByIdForUpdate(trx, heroId);
    if (!hero) {
      throw new NotFoundError(`Hero with id ${heroId} not found`);
    }
    if (hero.status !== 'available') {
      throw new ConflictError('Hero is already busy');
    }

    if (incident.level === 'critical' && !CRITICAL_REQUIRED_POWERS.includes(hero.power)) {
      throw new ForbiddenError(
        `Critical incidents require a hero with flight or strength. Hero "${hero.name}" has ${hero.power}`
      );
    }

    const updated = await incidentRepository.assignHero(trx, incidentId, heroId);
    await heroRepository.updateStatus(trx, heroId, 'busy');
    return updated;
  });
}

//Resolves an assigned incident and releases its hero back to the pool.

async function resolveIncident(incidentId) {
  return knex.transaction(async (trx) => {
    const incident = await incidentRepository.findByIdForUpdate(trx, incidentId);
    if (!incident) {
      throw new NotFoundError(`Incident with id ${incidentId} not found`);
    }
    if (incident.status === 'resolved') {
      throw new ConflictError('Incident is already resolved');
    }
    if (incident.status !== 'assigned') {
      throw new ConflictError('Only assigned incidents can be resolved');
    }

    const resolved = await incidentRepository.resolve(trx, incidentId);

    if (incident.hero_id) {
      await heroRepository.updateStatus(trx, incident.hero_id, 'available');
    }

    return resolved;
  });
}

module.exports = { listIncidents, createIncident, assignHero, resolveIncident };
