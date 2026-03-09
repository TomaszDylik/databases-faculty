const pool = require('../db');

const findAll = async ({ limit = 20, offset = 0 } = {}) => {
  const { rows } = await pool.query(
    `SELECT id, name, email, created_at
       FROM users
      ORDER BY id
      LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
};

const findById = async (id) => {
  const { rows } = await pool.query(
    'SELECT id, name, email, created_at FROM users WHERE id = $1',
    [id]
  );
  return rows[0] || null;
};

const findByEmail = async (email) => {
  const { rows } = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );
  return rows[0] || null;
};

const create = async ({ name, email }) => {
  const { rows } = await pool.query(
    `INSERT INTO users (name, email)
     VALUES ($1, $2)
     RETURNING id, name, email, created_at`,
    [name, email]
  );
  return rows[0];
};

module.exports = { findAll, findById, findByEmail, create };