const heroRepository = require('../repositories/heroRepository');
const { BadRequestError, ValidationError } = require('./errors');

const VALID_POWERS = ['flight', 'strength', 'telepathy', 'speed', 'invisibility'];
const VALID_STATUSES = ['available', 'busy', 'retired'];

//Returns heroes, optionally filtered by status and/or power.

async function listHeroes({ status, power } = {}) {
  if (status && !VALID_STATUSES.includes(status)) {
    throw new ValidationError(`Invalid status value "${status}". Allowed: ${VALID_STATUSES.join(', ')}`);
  }
  if (power && !VALID_POWERS.includes(power)) {
    throw new ValidationError(`Invalid power value "${power}". Allowed: ${VALID_POWERS.join(', ')}`);
  }
  return heroRepository.findAll({ status, power });
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
