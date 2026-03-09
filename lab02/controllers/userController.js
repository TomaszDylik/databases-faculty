const userService = require('../services/userService');

const HTTP_STATUS = {
  NOT_FOUND:        404,
  CONFLICT:         409,
  VALIDATION_ERROR: 422,
  FORBIDDEN:        403,
};

const handleError = (err, res) => {
  const status = HTTP_STATUS[err.code] || 500;
  const body   = status === 500
    ? { error: 'Internal Server Error' }
    : { error: err.message };
  if (status === 500) console.error(err);
  res.status(status).json(body);
};

// GET /api/v1/users?limit=10&offset=0
const getAll = async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit)  || 20, 100);
    const offset = Math.max(parseInt(req.query.offset) || 0,  0);
    const users  = await userService.findAll({ limit, offset });
    res.json({ data: users, meta: { limit, offset, count: users.length } });
  } catch (err) { handleError(err, res); }
};

// GET /api/v1/users/:id
const getOne = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'ID must be a number' });
    const user = await userService.findById(id);
    res.json({ data: user });
  } catch (err) { handleError(err, res); }
};

// POST /api/v1/users
const create = async (req, res) => {
  try {
    const { name, email } = req.body || {};
    if (!name || !email)
      return res.status(400).json({ error: 'name and email are required' });
    const user = await userService.create({ name, email });
    res.status(201)
       .location(`/api/v1/users/${user.id}`)
       .json({ data: user });
  } catch (err) { handleError(err, res); }
};

module.exports = { getAll, getOne, create };