require('dotenv').config({ path: `${__dirname}/.env`, override: true });
const express = require('express');
const heroesRouter    = require('./routes/heroes');
const incidentsRouter = require('./routes/incidents');
const statsRouter     = require('./routes/stats');
const { BadRequestError, NotFoundError, ConflictError, ForbiddenError, ValidationError } = require('./services/errors');

const app = express();
app.use(express.json());

// Routes
app.use('/api/v1/heroes',    heroesRouter);
app.use('/api/v1/incidents', incidentsRouter);
app.use('/api/v1/stats',     statsRouter);

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
  if (err instanceof ValidationError)  return problem(422, 'Unprocessable Entity', err.message);
  if (err instanceof NotFoundError)    return problem(404, 'Not Found', err.message);
  if (err instanceof ConflictError)    return problem(409, 'Conflict', err.message);
  if (err instanceof ForbiddenError)   return problem(403, 'Forbidden', err.message);

  console.error(err.stack);
  return problem(500, 'Internal Server Error', 'An unexpected error occurred');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
