require('dotenv').config({ path: `${__dirname}/../.env` });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // czyszczenie: child-first
  await prisma.incidentCategory.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.hero.deleteMany();
  await prisma.category.deleteMany();

  // kategorie z jawnym id
  await prisma.category.createMany({
    data: [
      { id: 1, name: 'flood'     },
      { id: 2, name: 'fire'      },
      { id: 3, name: 'robbery'   },
      { id: 4, name: 'terrorism' },
      { id: 5, name: 'accident'  },
    ],
  });

  // 5 bohaterów — wszystkie moce i statusy
  await prisma.hero.createMany({
    data: [
      { id: 1, name: 'Alice Storm',    power: 'flight',       status: 'available', missionsCount: 10 },
      { id: 2, name: 'Bob Mighty',     power: 'strength',     status: 'busy',      missionsCount: 5  },
      { id: 3, name: 'Carol Mind',     power: 'telepathy',    status: 'available', missionsCount: 3  },
      { id: 4, name: 'Dave Runner',    power: 'speed',        status: 'busy',      missionsCount: 8  },
      { id: 5, name: 'Eve Shadow',     power: 'invisibility', status: 'retired',   missionsCount: 0  },
    ],
  });

  const A = new Date('2026-01-01T08:00:00Z');
  const B = new Date('2026-01-01T09:00:00Z');

  await prisma.incident.createMany({
    data: [
      { id: 1, location: 'Old Town Square',   district: 'Center', level: 'low',      status: 'open'     },
      { id: 2, location: 'City Hall',          district: 'Center', level: 'critical', status: 'open'     },
      { id: 3, location: 'Park Avenue',        district: 'North',  level: 'medium',   status: 'assigned',
        heroId: 4, assignedAt: A },
      { id: 4, location: 'Harbor Bridge',      district: 'South',  level: 'critical', status: 'assigned',
        heroId: 2, assignedAt: A },
      { id: 5, location: 'Green Valley Road',  district: 'East',   level: 'low',      status: 'resolved',
        heroId: 3, assignedAt: A, resolvedAt: new Date(A.getTime() + 30 * 60_000), resolutionMinutes: 30 },
      { id: 6, location: 'Central Station',    district: 'Center', level: 'medium',   status: 'resolved',
        heroId: 1, assignedAt: B, resolvedAt: new Date(B.getTime() + 45 * 60_000), resolutionMinutes: 45 },
      { id: 7, location: 'Riverside Market',   district: 'West',   level: 'medium',   status: 'open'     },
      { id: 8, location: 'Airport Terminal 2', district: 'South',  level: 'low',      status: 'open'     },
    ],
  });

  await prisma.incidentCategory.createMany({
    data: [
      { incidentId: 1, categoryId: 1 },
      { incidentId: 2, categoryId: 4 }, { incidentId: 2, categoryId: 2 },
      { incidentId: 3, categoryId: 3 },
      { incidentId: 4, categoryId: 4 },
      { incidentId: 5, categoryId: 1 },
      { incidentId: 6, categoryId: 2 },
      { incidentId: 7, categoryId: 5 },
      { incidentId: 8, categoryId: 3 },
    ],
  });

  // reset sekwencji postgres po jawnych ID
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"heroes"',    'id'), (SELECT MAX(id) FROM heroes),    true)`;
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"incidents"',  'id'), (SELECT MAX(id) FROM incidents),  true)`;
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"categories"', 'id'), (SELECT MAX(id) FROM categories), true)`;

  console.log('Test seed complete: 5 categories, 5 heroes, 8 incidents');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
