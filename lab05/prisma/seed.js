/**
 * prisma/seed.js — development seed (PostgreSQL)
 * Run with: npx prisma db seed   (configured in package.json → "prisma": { "seed": "node prisma/seed.js" })
 * Po seeding PostgreSQL uruchom: node mongo/seed.js  (aby uzupełnić MongoDB)
 */
require('dotenv').config({ path: `${__dirname}/../.env` });
const { PrismaClient } = require('@prisma/client');
const { faker }        = require('@faker-js/faker');

const prisma = new PrismaClient();

async function main() {
  // czyszczenie: child-first (FK)
  await prisma.incidentCategory.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.hero.deleteMany();
  await prisma.category.deleteMany();

  // 5 stałych kategorii
  await prisma.category.createMany({
    data: [
      { name: 'flood' },
      { name: 'fire' },
      { name: 'robbery' },
      { name: 'terrorism' },
      { name: 'accident' },
    ],
  });
  const categories  = await prisma.category.findMany({ orderBy: { id: 'asc' } });
  const categoryIds = categories.map((c) => c.id);

  // 20 bohaterów, faker.seed(7) — deterministyczne
  faker.seed(7);
  const powers = ['flight', 'strength', 'telepathy', 'speed', 'invisibility'];

  const heroData = [];
  for (let i = 0; i < 20; i++) {
    heroData.push({
      name:          faker.person.fullName() + ' ' + faker.string.alphanumeric(4),
      power:         faker.helpers.arrayElement(powers),
      missionsCount: faker.number.int({ min: 0, max: 50 }),
    });
  }
  await prisma.hero.createMany({ data: heroData });
  const heroes = await prisma.hero.findMany({ orderBy: { id: 'asc' } });

  // 60 incydentów — różne statusy, poziomy, bohaterowie
  const levels    = ['low', 'medium', 'critical'];
  const statuses  = ['open', 'assigned', 'resolved'];
  const BASE_DATE = new Date('2026-01-01T08:00:00.000Z');

  const availableHeroIds    = new Set(heroes.map((h) => h.id));
  const criticalEligibleIds = heroes
    .filter((h) => h.power === 'flight' || h.power === 'strength')
    .map((h) => h.id);
  const busyHeroIds = new Set();

  const incidentData         = [];
  const incidentCategoryMeta = [];

  for (let i = 0; i < 60; i++) {
    const level  = faker.helpers.arrayElement(levels);
    let   status = faker.helpers.arrayElement(statuses);

    let heroId            = null;
    let assignedAt        = null;
    let resolvedAt        = null;
    let resolutionMinutes = null;

    if (status !== 'open') {
      const candidates = (level === 'critical' ? criticalEligibleIds : heroes.map((h) => h.id))
        .filter((id) => availableHeroIds.has(id) || status === 'resolved');

      if (candidates.length === 0) {
        status = 'open';
      } else {
        heroId     = faker.helpers.arrayElement(candidates);
        assignedAt = new Date(BASE_DATE.getTime() + (i * 17 + 5) * 60_000);

        if (status === 'assigned') {
          availableHeroIds.delete(heroId);
          busyHeroIds.add(heroId);
        }
        if (status === 'resolved') {
          resolvedAt        = new Date(assignedAt.getTime() + ((i % 9 + 1) * 13) * 60_000);
          resolutionMinutes = (resolvedAt.getTime() - assignedAt.getTime()) / 60_000;
        }
      }
    }

    incidentData.push({
      location: faker.location.streetAddress(),
      district: faker.location.county(),
      level, status, heroId, assignedAt, resolvedAt, resolutionMinutes,
    });

    incidentCategoryMeta.push(
      faker.helpers.arrayElements(categoryIds, faker.number.int({ min: 1, max: 3 }))
    );
  }

  await prisma.incident.createMany({ data: incidentData });
  const createdIncidents = await prisma.incident.findMany({ orderBy: { id: 'asc' } });

  const icRecords = [];
  createdIncidents.forEach((inc, idx) => {
    for (const catId of incidentCategoryMeta[idx]) {
      icRecords.push({ incidentId: inc.id, categoryId: catId });
    }
  });
  if (icRecords.length > 0) {
    await prisma.incidentCategory.createMany({ data: icRecords });
  }

  for (const id of busyHeroIds) {
    await prisma.hero.update({ where: { id }, data: { status: 'busy' } });
  }

  console.log(`Seeded: ${categories.length} categories, ${heroes.length} heroes, ${createdIncidents.length} incidents`);
  console.log('Next: run `node mongo/seed.js` to populate MongoDB hero profiles');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
