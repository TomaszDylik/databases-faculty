const { Incident, Hero, sequelize } = require('../models');
const { Op } = require('sequelize');

async function findAll({ level, status, district, page = 1, pageSize = 10 } = {}) {
  const limit       = Math.min(parseInt(pageSize, 10), 50);
  const currentPage = Math.max(parseInt(page, 10), 1);
  const offset      = (currentPage - 1) * limit;

  const where = {};
  if (level)    where.level  = level;
  if (status)   where.status = status;
  if (district) where.district = { [Op.iLike]: `%${district}%` };

  const { count, rows } = await Incident.findAndCountAll({
    where,
    order:  [['created_at', 'DESC']],
    limit,
    offset,
  });

  const totalPages = Math.ceil(count / limit);
  return {
    data: rows,
    pagination: { page: currentPage, pageSize: limit, total: count, totalPages },
  };
}

// include triggers a single LEFT JOIN — avoids N+1 that would happen with a separate Hero.findByPk call
async function findById(id) {
  return Incident.findByPk(id, {
    include: [{ model: Hero, as: 'hero' }],
  });
}

// lock: true emits FOR UPDATE — used inside managed transactions to prevent race conditions
async function findByIdForUpdate(id, transaction) {
  return Incident.findByPk(id, { lock: true, transaction });
}

async function create({ location, level }) {
  return Incident.create({ location, level });
}

async function findByHeroId(heroId, { page = 1, pageSize = 10 } = {}) {
  const limit       = Math.min(parseInt(pageSize, 10), 50);
  const currentPage = Math.max(parseInt(page, 10), 1);
  const offset      = (currentPage - 1) * limit;

  const { count, rows } = await Incident.findAndCountAll({
    where:  { hero_id: heroId },
    order:  [['assigned_at', 'DESC'], ['id', 'DESC']],
    limit,
    offset,
  });

  const totalPages = Math.ceil(count / limit);
  return {
    data: rows,
    pagination: { page: currentPage, pageSize: limit, total: count, totalPages },
  };
}

async function assignHero(incidentId, heroId, transaction) {
  const incident = await Incident.findByPk(incidentId, { transaction });
  if (!incident) return null;
  return incident.update(
    { status: 'assigned', hero_id: heroId, assigned_at: new Date() },
    { transaction }
  );
}

async function resolve(incidentId, transaction) {
  const incident = await Incident.findByPk(incidentId, { transaction, lock: true });
  if (!incident) return null;

  let resolution_minutes = null;
  if (incident.assigned_at) {
    const ms = Date.now() - new Date(incident.assigned_at).getTime();
    resolution_minutes = Number((ms / 60000).toFixed(2));
  }

  return incident.update(
    { status: 'resolved', resolved_at: new Date(), resolution_minutes },
    { transaction }
  );
}

async function countAll() {
  return Incident.count();
}

async function countByStatus() {
  return Incident.findAll({
    attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
    group:      ['status'],
    order:      [['status', 'ASC']],
    raw:        true,
  });
}

async function countByLevel() {
  return Incident.findAll({
    attributes: ['level', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
    group:      ['level'],
    order:      [['level', 'ASC']],
    raw:        true,
  });
}

async function getAverageResolutionMinutes() {
  const result = await Incident.findOne({
    attributes: [
      [sequelize.fn('AVG', sequelize.col('resolution_minutes')), 'averageResolutionMinutes'],
    ],
    where: {
      status:             'resolved',
      resolution_minutes: { [Op.not]: null },
    },
    raw: true,
  });
  return result?.averageResolutionMinutes ? Number(result.averageResolutionMinutes) : 0;
}

module.exports = {
  findAll,
  findById,
  findByIdForUpdate,
  create,
  findByHeroId,
  assignHero,
  resolve,
  countAll,
  countByStatus,
  countByLevel,
  getAverageResolutionMinutes,
};
