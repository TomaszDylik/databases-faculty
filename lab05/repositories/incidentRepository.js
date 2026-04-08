const prisma = require('../prisma/client');

const INCIDENT_INCLUDE = {
  hero: {
    select: { id: true, name: true, power: true, status: true, missionsCount: true },
  },
  categories: {
    include: { category: true },
  },
};

async function findAll({ level, status, district, categoryId, exclude, page = 1, pageSize = 10 } = {}) {
  const take        = Math.min(parseInt(pageSize, 10), 50);
  const currentPage = Math.max(parseInt(page, 10), 1);
  const skip        = (currentPage - 1) * take;

  const where = {};
  if (level)    where.level    = level;
  if (status)   where.status   = status;
  if (district) where.district = { contains: district, mode: 'insensitive' };

  if (categoryId || exclude) {
    where.categories = {};
    if (categoryId) where.categories.some = { categoryId: parseInt(categoryId, 10) };
    if (exclude)    where.categories.none = { categoryId: parseInt(exclude,     10) };
  }

  const [total, data] = await Promise.all([
    prisma.incident.count({ where }),
    prisma.incident.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
  ]);

  return {
    data,
    pagination: { page: currentPage, pageSize: take, total, totalPages: Math.ceil(total / take) },
  };
}

async function findById(id) {
  return prisma.incident.findUnique({ where: { id }, include: INCIDENT_INCLUDE });
}

async function findByIdWithTx(id, tx) {
  return tx.incident.findUnique({ where: { id } });
}

async function create({ location, level, categoryIds = [] }) {
  return prisma.incident.create({
    data: {
      location,
      level,
      ...(categoryIds.length > 0 && {
        categories: {
          create: categoryIds.map((categoryId) => ({ categoryId })),
        },
      }),
    },
    include: INCIDENT_INCLUDE,
  });
}

async function findByHeroId(heroId, { page = 1, pageSize = 10 } = {}) {
  const take        = Math.min(parseInt(pageSize, 10), 50);
  const currentPage = Math.max(parseInt(page, 10), 1);
  const skip        = (currentPage - 1) * take;

  const [total, data] = await Promise.all([
    prisma.incident.count({ where: { heroId } }),
    prisma.incident.findMany({
      where:   { heroId },
      orderBy: [{ assignedAt: 'desc' }, { id: 'desc' }],
      skip,
      take,
    }),
  ]);

  return {
    data,
    pagination: { page: currentPage, pageSize: take, total, totalPages: Math.ceil(total / take) },
  };
}

async function assignHeroWithTx(incidentId, heroId, tx) {
  return tx.incident.update({
    where: { id: incidentId },
    data:  { status: 'assigned', heroId, assignedAt: new Date() },
  });
}

async function resolveWithTx(incidentId, resolutionMinutes, tx) {
  return tx.incident.update({
    where: { id: incidentId },
    data:  { status: 'resolved', resolvedAt: new Date(), resolutionMinutes },
  });
}

async function countAll() {
  return prisma.incident.count();
}

module.exports = {
  findAll, findById, findByIdWithTx,
  create, findByHeroId,
  assignHeroWithTx, resolveWithTx,
  countAll,
};
