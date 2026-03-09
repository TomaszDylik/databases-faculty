const pool = require('../db');
const incidentRepository = require('../repositories/incidentRepository');
const heroRepository = require('../repositories/heroRepository');
const { BadRequestError, ValidationError, NotFoundError, ConflictError, ForbiddenError } = require('./errors');

const VALID_LEVELS = ['low', 'medium', 'critical'];
const VALID_STATUSES = ['open', 'assigned', 'resolved'];

//Powers that qualify a hero for a CRITICAL-level incident.

const CRITICAL_REQUIRED_POWERS = ['flight', 'strength'];

//Returns incidents, optionally filtered by level and/or status.

async function listIncidents({ level, status } = {}) {
  if (level && !VALID_LEVELS.includes(level)) {
    throw new ValidationError(`Invalid level value "${level}". Allowed: ${VALID_LEVELS.join(', ')}`);
  }
  if (status && !VALID_STATUSES.includes(status)) {
    throw new ValidationError(`Invalid status value "${status}". Allowed: ${VALID_STATUSES.join(', ')}`);
  }
  return incidentRepository.findAll({ level, status });
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

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const incident = await incidentRepository.findByIdForUpdate(client, incidentId);
    if (!incident) {
      throw new NotFoundError(`Incident with id ${incidentId} not found`);
    }
    if (incident.status !== 'open') {
      throw new ConflictError(`Incident is already ${incident.status}`);
    }

    const hero = await heroRepository.findByIdForUpdate(client, heroId);
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

    const updated = await incidentRepository.assignHero(client, incidentId, heroId);
    await heroRepository.updateStatus(client, heroId, 'busy');

    await client.query('COMMIT');
    return updated;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

//Resolves an assigned incident and releases its hero back to the pool.

async function resolveIncident(incidentId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const incident = await incidentRepository.findByIdForUpdate(client, incidentId);
    if (!incident) {
      throw new NotFoundError(`Incident with id ${incidentId} not found`);
    }
    if (incident.status === 'resolved') {
      throw new ConflictError('Incident is already resolved');
    }
    if (incident.status !== 'assigned') {
      throw new ConflictError('Only assigned incidents can be resolved');
    }

    const resolved = await incidentRepository.resolve(client, incidentId);

    if (incident.hero_id) {
      await heroRepository.updateStatus(client, incident.hero_id, 'available');
    }

    await client.query('COMMIT');
    return resolved;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { listIncidents, createIncident, assignHero, resolveIncident };
