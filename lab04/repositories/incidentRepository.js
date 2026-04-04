const prisma = require('../prisma/client');

// stały kształt include — LEFT JOIN w jednym zapytaniu
const INCIDENT_INCLUDE = {
  hero: {
    // tylko potrzebne pola bohatera
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

  // filtry relacyjne M:N — some/none
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

// jeden LEFT JOIN, bez N+1
async function findById(id) {
  return prisma.incident.findUnique({ where: { id }, include: INCIDENT_INCLUDE });
}

// wewnątrz $transaction — tylko wiersz do walidacji
async function findByIdWithTx(id, tx) {
  return tx.incident.findUnique({ where: { id } });
}

// zagnieżdżony create — incydent + kategorie atomowo
async function create({ location, level, categoryIds = [] }) {
  return prisma.incident.create({
    data: {
      location,
      level,
      ...(categoryIds.length > 0 && {
        // nested write — rekordy junction atomowo
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

// wewnątrz $transaction — tx.* nie prisma.*
async function assignHeroWithTx(incidentId, heroId, tx) {
  return tx.incident.update({
    where: { id: incidentId },
    data:  { status: 'assigned', heroId, assignedAt: new Date() },
  });
}

// wewnątrz $transaction — brak hooka, missionsCount w serwisie
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
