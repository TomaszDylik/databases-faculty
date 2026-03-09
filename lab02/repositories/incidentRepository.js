const pool = require('../db');

async function findAll({ level, status } = {}) {
  const conditions = [];
  const values = [];

  if (level) {
    values.push(level);
    conditions.push(`level = $${values.length}`);
  }
  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT * FROM incidents ${where} ORDER BY created_at DESC`,
    values
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query('SELECT * FROM incidents WHERE id = $1', [id]);
  return rows[0] ?? null;
}

async function findByIdForUpdate(client, id) {
  const { rows } = await client.query(
    'SELECT * FROM incidents WHERE id = $1 FOR UPDATE',
    [id]
  );
  return rows[0] ?? null;
}

async function create({ location, level }) {
  const { rows } = await pool.query(
    'INSERT INTO incidents (location, level) VALUES ($1, $2) RETURNING *',
    [location, level]
  );
  return rows[0];
}

async function assignHero(client, incidentId, heroId) {
  const { rows } = await client.query(
    'UPDATE incidents SET status = $1, hero_id = $2 WHERE id = $3 RETURNING *',
    ['assigned', heroId, incidentId]
  );
  return rows[0];
}

async function resolve(client, incidentId) {
  const { rows } = await client.query(
    'UPDATE incidents SET status = $1 WHERE id = $2 RETURNING *',
    ['resolved', incidentId]
  );
  return rows[0];
}

module.exports = { findAll, findById, findByIdForUpdate, create, assignHero, resolve };
