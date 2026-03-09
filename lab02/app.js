require('dotenv').config({ path: `${__dirname}/.env`, override: true });
const express = require('express');
const pool = require('./db');
const usersRouter = require('./routes/users');
const heroesRouter = require('./routes/heroes');
const incidentsRouter = require('./routes/incidents');
const { BadRequestError, NotFoundError, ConflictError, ForbiddenError, ValidationError } = require('./services/errors');

const app = express();
app.use(express.json());

// Routes 
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/heroes', heroesRouter);
app.use('/api/v1/incidents', incidentsRouter);
app.use((err, req, res, next) => {
  /** @param {number} status @param {string} title @param {string} detail */
  const problem = (status, title, detail) =>
    res.status(status).set('Content-Type', 'application/problem+json').json({
      type: 'about:blank',
      title,
      status,
      detail,
    });

  if (err instanceof BadRequestError)  return problem(400, 'Bad Request', err.message);
  if (err instanceof ValidationError) return problem(422, 'Unprocessable Entity', err.message);
  if (err instanceof NotFoundError)   return problem(404, 'Not Found', err.message);
  if (err instanceof ConflictError)   return problem(409, 'Conflict', err.message);
  if (err instanceof ForbiddenError)  return problem(403, 'Forbidden', err.message);

  console.error(err.stack);
  return problem(500, 'Internal Server Error', 'An unexpected error occurred');
});

// Start
const PORT = process.env.PORT || 3000;

const start = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id         SERIAL PRIMARY KEY,
        name       TEXT NOT NULL,
        email      TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Heroes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS heroes (
        id         SERIAL PRIMARY KEY,
        name       TEXT NOT NULL,
        power      TEXT NOT NULL
                     CHECK (power IN ('flight','strength','telepathy','speed','invisibility')),
        status     TEXT NOT NULL DEFAULT 'available'
                     CHECK (status IN ('available','busy')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Incidents
    await pool.query(`
      CREATE TABLE IF NOT EXISTS incidents (
        id         SERIAL PRIMARY KEY,
        location   TEXT NOT NULL,
        level      TEXT NOT NULL
                     CHECK (level IN ('low','medium','critical')),
        status     TEXT NOT NULL DEFAULT 'open'
                     CHECK (status IN ('open','assigned','resolved')),
        hero_id    INTEGER REFERENCES heroes(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Startup error:', err.message);
    process.exit(1);
  }
};

start();