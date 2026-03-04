const userRepository = require('../repositories/userRepository');

// DTO — decyduje co trafia do klienta, co zostaje w bazie
const toDTO = (row) => ({
  id:        row.id,
  name:      row.name,
  email:     row.email,
  createdAt: row.created_at.toISOString(),
});

const makeError = (message, code) => {
  const err = new Error(message);
  err.code = code;
  return err;
};

const findAll = async ({ limit, offset } = {}) => {
  const rows = await userRepository.findAll({ limit, offset });
  return rows.map(toDTO);
};

const findById = async (id) => {
  const row = await userRepository.findById(id);
  if (!row) throw makeError(`User ${id} not found`, 'NOT_FOUND');
  return toDTO(row);
};

const create = async ({ name, email }) => {
  // Walidacja domenowa
  if (!name?.trim())           throw makeError('Name is required',         'VALIDATION_ERROR');
  if (!email?.includes('@'))   throw makeError('Invalid email format',     'VALIDATION_ERROR');

  // Sprawdzenie unikalności — pyta Repository, nie bazę bezpośrednio
  const existing = await userRepository.findByEmail(email);
  if (existing) throw makeError('Email already registered', 'CONFLICT');

  const row = await userRepository.create({ name: name.trim(), email });
  return toDTO(row);
};

module.exports = { findAll, findById, create };