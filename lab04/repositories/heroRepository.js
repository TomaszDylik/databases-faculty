const prisma = require('../prisma/client');

// zamiennik scope('available') z Sequelize
const AVAILABLE_WHERE = { status: 'available' };

// mapowanie snake_case → camelCase dla sortowania
const SORT_MAP = {
  name:           'name',
  missions_count: 'missionsCount',
  created_at:     'createdAt',
};

async function findAll({ status, power, sortBy = 'created_at', sortDir = 'desc', page = 1, pageSize = 10 } = {}) {
  const take        = Math.min(parseInt(pageSize, 10), 50);
  const currentPage = Math.max(parseInt(page, 10), 1);
  const skip        = (currentPage - 1) * take;

  const where = {};
  if (power) where.power = power;

  // jeden punkt definicji warunku 'available'
  if (status === 'available') {
    Object.assign(where, AVAILABLE_WHERE);
  } else if (status) {
    where.status = status;
  }

  const orderField = SORT_MAP[sortBy] || 'createdAt';
  const orderBy    = { [orderField]: sortDir };

  const [total, data] = await Promise.all([
    prisma.hero.count({ where }),
    prisma.hero.findMany({ where, orderBy, skip, take }),
  ]);

  return {
    data,
    pagination: { page: currentPage, pageSize: take, total, totalPages: Math.ceil(total / take) },
  };
}

async function findById(id) {
  return prisma.hero.findUnique({ where: { id } });
}

// wewnątrz $transaction — operacje przez tx
async function findByIdWithTx(id, tx) {
  return tx.hero.findUnique({ where: { id } });
}

async function create({ name, power }) {
  return prisma.hero.create({ data: { name, power } });
}

async function update(id, data) {
  return prisma.hero.update({ where: { id }, data });
}

// tx opcjonalnie — standalone lub wewnątrz transakcji
async function updateStatus(id, status, tx) {
  const client = tx || prisma;
  return client.hero.update({ where: { id }, data: { status } });
}

async function countAll() {
  return prisma.hero.count();
}

// nie używane w statsService — tam $queryRaw
async function countByStatus() {
  return prisma.hero.groupBy({ by: ['status'], _count: { id: true }, orderBy: { status: 'asc' } });
}

async function countByPower() {
  return prisma.hero.groupBy({ by: ['power'], _count: { id: true }, orderBy: { power: 'asc' } });
}

module.exports = {
  findAll, findById, findByIdWithTx,
  create, update, updateStatus,
  countAll, countByStatus, countByPower,
  AVAILABLE_WHERE,
};
