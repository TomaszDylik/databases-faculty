const knex = require('../db/knex');

async function findAll({ status, power, sortBy = 'created_at', sortDir = 'desc', page = 1, pageSize = 10 } = {}) {
  const limit = Math.min(parseInt(pageSize, 10), 50);
  const currentPage = Math.max(parseInt(page, 10), 1);
  const offset = (currentPage - 1) * limit;

  const query = knex('heroes');

  if (status) {
    query.where('status', status);
  }
  if (power) {
    query.where('power', power);
  }

  // 1. Tworzymy zapytanie do pobrania danych z paginacją i sortowaniem
  const countQuery = query.clone().count('* as total').first();

  // 2. Dodajemy sortowanie i paginację do głównego zapytania
  query.orderBy(sortBy, sortDir).limit(limit).offset(offset);

  // 3. Wykonujemy oba zapytania równocześnie
  const [countResult, data] = await Promise.all([countQuery, query]);
  
  // 4. Obliczamy total i totalPages na podstawie wyniku countQuery
  const total = parseInt(countResult.total, 10);
  const totalPages = Math.ceil(total / limit);

  // 5. Zwracamy dane wraz z informacjami o paginacji
  return {
    data,
    pagination: {
      page: currentPage,
      pageSize: limit,
      total,
      totalPages
    }
  };
}

async function findById(id) {
  return await knex('heroes').where('id', id).first() ?? null;
}

async function findByIdForUpdate(trx, id) {
  return await trx('heroes').where('id', id).first().forUpdate() ?? null;
}

async function create({ name, power }) {
  const [newHero] = await knex('heroes').insert({ name, power }).returning('*');
  return newHero;
}

async function update(id, updates) {
  const [updatedHero] = await knex('heroes')
    .where('id', id)
    .update({
      ...updates,
      updated_at: knex.fn.now(),
    })
    .returning('*');
  return updatedHero ?? null;
}

async function updateStatus(trx, id, status) {
  const [updatedHero] = await trx('heroes')
    .where('id', id)
    .update({
      status,
      updated_at: trx.fn.now(),
    })
    .returning('*');
  return updatedHero;
}

async function countAll() {
  const result = await knex('heroes').count('* as total').first();
  return parseInt(result.total, 10);
}

async function countByStatus() {
  return knex('heroes')
    .select('status')
    .count('* as count')
    .groupBy('status')
    .orderBy('status', 'asc');
}

async function countByPower() {
  return knex('heroes')
    .select('power')
    .count('* as count')
    .groupBy('power')
    .orderBy('power', 'asc');
}

module.exports = { findAll, findById, findByIdForUpdate, create, update, updateStatus, countAll, countByStatus, countByPower };