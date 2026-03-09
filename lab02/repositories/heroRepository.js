const pool = require('../db');

async function findAll({ status, power } = {}) {
  const conditions = [];
  const values = [];

  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }
  if (power) {
    values.push(power);
    conditions.push(`power = $${values.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT * FROM heroes ${where} ORDER BY created_at DESC`,
    values
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query('SELECT * FROM heroes WHERE id = $1', [id]);
  return rows[0] ?? null;
}

async function findByIdForUpdate(client, id) {
  const { rows } = await client.query(
    'SELECT * FROM heroes WHERE id = $1 FOR UPDATE',
    [id]
  );
  return rows[0] ?? null;
}

async function create({ name, power }) {
  const { rows } = await pool.query(
    'INSERT INTO heroes (name, power) VALUES ($1, $2) RETURNING *',
    [name, power]
  );
  return rows[0];
}

async function updateStatus(client, id, status) {
  const { rows } = await client.query(
    'UPDATE heroes SET status = $1 WHERE id = $2 RETURNING *',
    [status, id]
  );
  return rows[0];
}

module.exports = { findAll, findById, findByIdForUpdate, create, updateStatus };
