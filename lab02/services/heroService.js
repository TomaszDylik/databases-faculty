const heroRepository = require('../repositories/heroRepository');
const { BadRequestError, ValidationError } = require('./errors');

const VALID_POWERS = ['flight', 'strength', 'telepathy', 'speed', 'invisibility'];
const VALID_STATUSES = ['available', 'busy', 'retired'];
const VALID_SORT_FIELDS = ['name', 'missions_count', 'created_at'];
const VALID_SORT_DIRECTIONS = ['asc', 'desc'];

//Returns heroes, optionally filtered by status and/or power.

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
  if (page !== undefined && (!Number.isInteger(page) || page < 1)) {
    throw new ValidationError('Query parameter "page" must be a positive integer');
  }
  if (pageSize !== undefined && (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50)) {
    throw new ValidationError('Query parameter "pageSize" must be an integer between 1 and 50');
  }
  return heroRepository.findAll({ status, power, sortBy, sortDir, page, pageSize });
}

//Registers a new hero.

async function createHero({ name, power }) {
  if (!name || !power) {
    throw new BadRequestError('Fields "name" and "power" are required');
  }
  if (!VALID_POWERS.includes(power)) {
    throw new ValidationError(`Power must be one of: ${VALID_POWERS.join(', ')}`);
  }
  return heroRepository.create({ name, power });
}

module.exports = { listHeroes, createHero };
