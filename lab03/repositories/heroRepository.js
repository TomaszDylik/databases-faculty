const { Hero, sequelize } = require('../models');
const { Op } = require('sequelize');

async function findAll({ status, power, sortBy = 'created_at', sortDir = 'desc', page = 1, pageSize = 10 } = {}) {
  const limit       = Math.min(parseInt(pageSize, 10), 50);
  const currentPage = Math.max(parseInt(page, 10), 1);
  const offset      = (currentPage - 1) * limit;

  const where = {};
  if (power) where.power = power;

  // apply named scope so the 'available' condition is never duplicated outside the model
  let base = Hero;
  if (status === 'available') {
    base = Hero.scope('available');
  } else if (status) {
    where.status = status;
  }

  const { count, rows } = await base.findAndCountAll({
    where,
    order:  [[sortBy, sortDir.toUpperCase()]],
    limit,
    offset,
  });

  const totalPages = Math.ceil(count / limit);
  return {
    data: rows,
    pagination: { page: currentPage, pageSize: limit, total: count, totalPages },
  };
}

async function findById(id) {
  return Hero.findByPk(id);
}

// lock: true emits FOR UPDATE — prevents concurrent transactions from reading stale state
async function findByIdForUpdate(id, transaction) {
  return Hero.findByPk(id, { lock: true, transaction });
}

async function create({ name, power }) {
  return Hero.create({ name, power });
}

async function update(id, updates) {
  const hero = await Hero.findByPk(id);
  if (!hero) return null;
  return hero.update(updates);
}

async function updateStatus(id, status, transaction) {
  const hero = await Hero.findByPk(id, { transaction });
  if (!hero) return null;
  return hero.update({ status }, { transaction });
}

async function countAll() {
  return Hero.count();
}

// sequelize.fn builds SELECT status, COUNT(id) AS count ... GROUP BY status — no raw SQL
async function countByStatus() {
  return Hero.findAll({
    attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
    group:      ['status'],
    order:      [['status', 'ASC']],
    raw:        true,
  });
}

async function countByPower() {
  return Hero.findAll({
    attributes: ['power', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
    group:      ['power'],
    order:      [['power', 'ASC']],
    raw:        true,
  });
}

module.exports = {
  findAll,
  findById,
  findByIdForUpdate,
  create,
  update,
  updateStatus,
  countAll,
  countByStatus,
  countByPower,
};
