const knex = require('../db/knex');

async function findAll({ level, status, district, page = 1, pageSize = 10 } = {}) {
  const limit = Math.min(parseInt(pageSize, 10), 50);
  const currentPage = Math.max(parseInt(page, 10), 1);
  const offset = (currentPage - 1) * limit;

  const query = knex('incidents');

  if (level) {
    query.where('level', level);
  }
  if (status) {
    query.where('status', status);
  }
  if (district) {
    query.where('district', 'ILIKE', `%${district}%`);
  }

  const countQuery = query.clone().count('* as total').first();

  query.orderBy('created_at', 'desc').limit(limit).offset(offset);

  const [countResult, data] = await Promise.all([countQuery, query]);
  const total = parseInt(countResult.total, 10);
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page: currentPage,
      pageSize: limit,
      total,
      totalPages,
    },
  };
}

async function findById(id) {
  return await knex('incidents').where('id', id).first() ?? null;
}

async function findByIdForUpdate(trx, id) {
  return await trx('incidents').where('id', id).first().forUpdate() ?? null;
}

async function create({ location, level }) {
  const [newIncident] = await knex('incidents').insert({ location, level }).returning('*');
  return newIncident;
}

async function findByHeroId(heroId, { page = 1, pageSize = 10 } = {}) {
  const limit = Math.min(parseInt(pageSize, 10), 50);
  const currentPage = Math.max(parseInt(page, 10), 1);
  const offset = (currentPage - 1) * limit;

  const query = knex('incidents').where('hero_id', heroId);
  const countQuery = query.clone().count('* as total').first();

  query.orderBy('assigned_at', 'desc').orderBy('id', 'desc').limit(limit).offset(offset);

  const [countResult, data] = await Promise.all([countQuery, query]);
  const total = parseInt(countResult.total, 10);
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page: currentPage,
      pageSize: limit,
      total,
      totalPages,
    },
  };
}

async function assignHero(trx, incidentId, heroId) {
  const [updatedIncident] = await trx('incidents')
    .where('id', incidentId)
    .update({
      status: 'assigned',
      hero_id: heroId,
      assigned_at: trx.fn.now(),
      updated_at: trx.fn.now(),
    })
    .returning('*');
  return updatedIncident;
}

async function resolve(trx, incidentId) {
  const incident = await findByIdForUpdate(trx, incidentId);
  let resolutionMinutes = null;

  if (incident?.assigned_at) {
    const assignedAt = new Date(incident.assigned_at).getTime();
    const resolvedAt = Date.now();
    resolutionMinutes = Number(((resolvedAt - assignedAt) / 60000).toFixed(2));
  }

  const [updatedIncident] = await trx('incidents')
    .where('id', incidentId)
    .update({
      status: 'resolved',
      resolved_at: trx.fn.now(),
      resolution_minutes: resolutionMinutes,
      updated_at: trx.fn.now(),
    })
    .returning('*');
  return updatedIncident;
}

async function countAll() {
  const result = await knex('incidents').count('* as total').first();
  return parseInt(result.total, 10);
}

async function countByStatus() {
  return knex('incidents')
    .select('status')
    .count('* as count')
    .groupBy('status')
    .orderBy('status', 'asc');
}

async function countByLevel() {
  return knex('incidents')
    .select('level')
    .count('* as count')
    .groupBy('level')
    .orderBy('level', 'asc');
}

async function getAverageResolutionMinutes() {
  const result = await knex('incidents')
    .where('status', 'resolved')
    .whereNotNull('resolution_minutes')
    .avg('resolution_minutes as averageResolutionMinutes')
    .first();

  return result?.averageResolutionMinutes ? Number(result.averageResolutionMinutes) : 0;
}

module.exports = {
  findAll,
  findById,
  findByIdForUpdate,
  create,
  findByHeroId,
  assignHero,
  resolve,
  countAll,
  countByStatus,
  countByLevel,
  getAverageResolutionMinutes,
};
