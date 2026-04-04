const heroRepository     = require('../repositories/heroRepository');
const incidentRepository = require('../repositories/incidentRepository');
const { BadRequestError, ValidationError, NotFoundError } = require('./errors');

const VALID_POWERS          = ['flight', 'strength', 'telepathy', 'speed', 'invisibility'];
const VALID_STATUSES        = ['available', 'busy', 'retired'];
const VALID_SORT_FIELDS     = ['name', 'missions_count', 'created_at'];
const VALID_SORT_DIRECTIONS = ['asc', 'desc'];

function validateHeroId(heroId) {
  if (!Number.isInteger(heroId) || heroId < 1)
    throw new ValidationError('Hero id must be a positive integer');
}

async function listHeroes({ status, power, sortBy, sortDir, page, pageSize } = {}) {
  if (status  && !VALID_STATUSES.includes(status))
    throw new ValidationError(`Invalid status "${status}". Allowed: ${VALID_STATUSES.join(', ')}`);
  if (power   && !VALID_POWERS.includes(power))
    throw new ValidationError(`Invalid power "${power}". Allowed: ${VALID_POWERS.join(', ')}`);
  if (sortBy  && !VALID_SORT_FIELDS.includes(sortBy))
    throw new ValidationError(`Invalid sortBy "${sortBy}". Allowed: ${VALID_SORT_FIELDS.join(', ')}`);
  if (sortDir && !VALID_SORT_DIRECTIONS.includes(sortDir))
    throw new ValidationError(`Invalid sortDir "${sortDir}". Allowed: ${VALID_SORT_DIRECTIONS.join(', ')}`);
  if (page     !== undefined && (!Number.isInteger(page)     || page < 1))
    throw new ValidationError('Query parameter "page" must be a positive integer');
  if (pageSize !== undefined && (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50))
    throw new ValidationError('Query parameter "pageSize" must be an integer between 1 and 50');
  return heroRepository.findAll({ status, power, sortBy, sortDir, page, pageSize });
}

async function getHeroById(heroId) {
  validateHeroId(heroId);
  const hero = await heroRepository.findById(heroId);
  if (!hero) throw new NotFoundError(`Hero with id ${heroId} not found`);
  return hero;
}

async function createHero({ name, power }) {
  if (!name || !power) throw new BadRequestError('Fields "name" and "power" are required');
  if (!VALID_POWERS.includes(power))
    throw new ValidationError(`Power must be one of: ${VALID_POWERS.join(', ')}`);
  // trim tu, bo Prisma nie ma beforeValidate
  return heroRepository.create({ name: name.trim(), power });
}

async function updateHero(heroId, payload = {}) {
  validateHeroId(heroId);

  const updates = {};

  if (payload.name !== undefined) {
    if (typeof payload.name !== 'string' || payload.name.trim().length === 0)
      throw new ValidationError('Field "name" must be a non-empty string');
    updates.name = payload.name.trim();
  }
  if (payload.power !== undefined) {
    if (!VALID_POWERS.includes(payload.power))
      throw new ValidationError(`Power must be one of: ${VALID_POWERS.join(', ')}`);
    updates.power = payload.power;
  }
  if (payload.status !== undefined) {
    if (!VALID_STATUSES.includes(payload.status))
      throw new ValidationError(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
    updates.status = payload.status;
  }
  // mapowanie missions_count → missionsCount
  if (payload.missions_count !== undefined) {
    if (!Number.isInteger(payload.missions_count) || payload.missions_count < 0)
      throw new ValidationError('Field "missions_count" must be a non-negative integer');
    updates.missionsCount = payload.missions_count;
  }

  if (Object.keys(updates).length === 0)
    throw new BadRequestError('Provide at least one field to update');

  const existing = await heroRepository.findById(heroId);
  if (!existing) throw new NotFoundError(`Hero with id ${heroId} not found`);

  return heroRepository.update(heroId, updates);
}

async function listHeroIncidents(heroId, { page, pageSize } = {}) {
  validateHeroId(heroId);
  if (page     !== undefined && (!Number.isInteger(page)     || page < 1))
    throw new ValidationError('Query parameter "page" must be a positive integer');
  if (pageSize !== undefined && (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50))
    throw new ValidationError('Query parameter "pageSize" must be an integer between 1 and 50');
  const hero = await heroRepository.findById(heroId);
  if (!hero) throw new NotFoundError(`Hero with id ${heroId} not found`);
  return incidentRepository.findByHeroId(heroId, { page, pageSize });
}

module.exports = { listHeroes, getHeroById, createHero, updateHero, listHeroIncidents };
