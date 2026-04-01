const heroRepository     = require('../repositories/heroRepository');
const incidentRepository = require('../repositories/incidentRepository');
const { BadRequestError, ValidationError, NotFoundError } = require('./errors');

const VALID_POWERS          = ['flight', 'strength', 'telepathy', 'speed', 'invisibility'];
const VALID_STATUSES        = ['available', 'busy', 'retired'];
const VALID_SORT_FIELDS     = ['name', 'missions_count', 'created_at'];
const VALID_SORT_DIRECTIONS = ['asc', 'desc'];

function validateHeroId(heroId) {
  if (!Number.isInteger(heroId) || heroId < 1) {
    throw new ValidationError('Hero id must be a positive integer');
  }
}

function validatePage(page) {
  if (page !== undefined && (!Number.isInteger(page) || page < 1)) {
    throw new ValidationError('Query parameter "page" must be a positive integer');
  }
}

function validatePageSize(pageSize) {
  if (pageSize !== undefined && (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50)) {
    throw new ValidationError('Query parameter "pageSize" must be an integer between 1 and 50');
  }
}

async function listHeroes({ status, power, sortBy, sortDir, page, pageSize } = {}) {
  if (status && !VALID_STATUSES.includes(status)) {
    throw new ValidationError(`Invalid status value "${status}". Allowed: ${VALID_STATUSES.join(', ')}`);
  }
  if (power && !VALID_POWERS.includes(power)) {
    throw new ValidationError(`Invalid power value "${power}". Allowed: ${VALID_POWERS.join(', ')}`);
  }
  if (sortBy && !VALID_SORT_FIELDS.includes(sortBy)) {
    throw new ValidationError(`Invalid sortBy value "${sortBy}". Allowed: ${VALID_SORT_FIELDS.join(', ')}`);
  }
  if (sortDir && !VALID_SORT_DIRECTIONS.includes(sortDir)) {
    throw new ValidationError(`Invalid sortDir value "${sortDir}". Allowed: ${VALID_SORT_DIRECTIONS.join(', ')}`);
  }
  validatePage(page);
  validatePageSize(pageSize);
  return heroRepository.findAll({ status, power, sortBy, sortDir, page, pageSize });
}

async function getHeroById(heroId) {
  validateHeroId(heroId);
  const hero = await heroRepository.findById(heroId);
  if (!hero) {
    throw new NotFoundError(`Hero with id ${heroId} not found`);
  }
  return hero;
}

async function createHero({ name, power }) {
  if (!name || !power) {
    throw new BadRequestError('Fields "name" and "power" are required');
  }
  if (!VALID_POWERS.includes(power)) {
    throw new ValidationError(`Power must be one of: ${VALID_POWERS.join(', ')}`);
  }
  return heroRepository.create({ name, power });
}

async function updateHero(heroId, payload = {}) {
  validateHeroId(heroId);

  const updates = {};

  if (payload.name !== undefined) {
    if (typeof payload.name !== 'string' || payload.name.trim().length === 0) {
      throw new ValidationError('Field "name" must be a non-empty string');
    }
    updates.name = payload.name.trim();
  }

  if (payload.power !== undefined) {
    if (!VALID_POWERS.includes(payload.power)) {
      throw new ValidationError(`Power must be one of: ${VALID_POWERS.join(', ')}`);
    }
    updates.power = payload.power;
  }

  if (payload.status !== undefined) {
    if (!VALID_STATUSES.includes(payload.status)) {
      throw new ValidationError(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
    }
    updates.status = payload.status;
  }

  if (payload.missions_count !== undefined) {
    if (!Number.isInteger(payload.missions_count) || payload.missions_count < 0) {
      throw new ValidationError('Field "missions_count" must be a non-negative integer');
    }
    updates.missions_count = payload.missions_count;
  }

  if (Object.keys(updates).length === 0) {
    throw new BadRequestError('Provide at least one field to update');
  }

  const hero = await heroRepository.update(heroId, updates);
  if (!hero) {
    throw new NotFoundError(`Hero with id ${heroId} not found`);
  }
  return hero;
}

async function listHeroIncidents(heroId, { page, pageSize } = {}) {
  validateHeroId(heroId);
  validatePage(page);
  validatePageSize(pageSize);

  await getHeroById(heroId);
  return incidentRepository.findByHeroId(heroId, { page, pageSize });
}

module.exports = { listHeroes, getHeroById, createHero, updateHero, listHeroIncidents };
