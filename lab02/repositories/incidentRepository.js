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

async function assignHero(trx, incidentId, heroId) {
  const [updatedIncident] = await trx('incidents')
    .where('id', incidentId)
    .update({
      status: 'assigned',
      hero_id: heroId,
      assigned_at: trx.fn.now(),
    })
    .returning('*');
  return updatedIncident;
}

async function resolve(trx, incidentId) {
  const [updatedIncident] = await trx('incidents')
    .where('id', incidentId)
    .update({
      status: 'resolved',
      resolved_at: trx.fn.now(),
    })
    .returning('*');
  return updatedIncident;
}

module.exports = { findAll, findById, findByIdForUpdate, create, assignHero, resolve };
