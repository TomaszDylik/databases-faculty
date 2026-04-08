/**
 * mongo/seed.js — seed kolekcji heroProfiles w MongoDB
 *
 * Uruchamiany po `npx prisma db seed` (PostgreSQL musi mieć 20 bohaterów):
 *   node mongo/seed.js
 *
 * Co robi:
 *   1. Łączy się z MongoDB i PostgreSQL
 *   2. Czyści kolekcję heroProfiles (deleteMany — brak duplikatów przy wielokrotnym uruchomieniu)
 *   3. Pobiera 20 bohaterów z PostgreSQL — missionsCount jako źródło prawdy dla stats.totalMissions
 *   4. Buduje 20 dokumentów i wstawia je jednym insertMany
 *
 * Specyfika dokumentów:
 *   - nie wszystkie mają pole bio (co 4. bohater go nie ma)
 *   - nie wszystkie mają pole specializations (co 3. bohater — pole całkowicie nieobecne)
 *   - reszta ma specializations jako tablicę (może być pusta lub z wartościami)
 *   - stats.totalMissions === hero.missionsCount z PostgreSQL
 */
require('dotenv').config({ path: `${__dirname}/../.env` });
const prisma              = require('../prisma/client');
const { client, heroProfiles } = require('./client');
const { faker }           = require('@faker-js/faker');

const SPECIALIZATIONS = ['rescue', 'combat', 'stealth', 'tech', 'medicine', 'recon', 'evacuation', 'negotiation'];
const LEVELS          = ['low', 'medium', 'critical'];

async function main() {
  // 1. Połącz z MongoDB
  await client.connect();
  const col = heroProfiles();

  // 2. Wyczyść kolekcję — brak duplikatów przy wielokrotnym uruchomieniu
  await col.deleteMany({});

  // 3. Pobierz bohaterów z PostgreSQL
  faker.seed(42); // inne ziarno niż prisma/seed.js — inne dane, ale deterministyczne
  const heroes = await prisma.hero.findMany({ orderBy: { id: 'asc' } });

  if (heroes.length === 0) {
    throw new Error('Brak bohaterów w PostgreSQL. Uruchom najpierw: npx prisma db seed');
  }

  const now = new Date();

  // 4. Buduj dokumenty
  const profiles = heroes.map((hero, idx) => {
    // Bio: co 4. bohater (idx % 4 === 3) nie ma pola bio
    const hasBio = idx % 4 !== 3;

    // Specializations:
    //   idx % 3 === 0  → pole całkowicie nieobecne
    //   idx % 3 === 1  → pusta tablica []
    //   idx % 3 === 2  → tablica z wartościami
    let specializationsField = {};
    if (idx % 3 === 0) {
      // pole nieobecne — nie dodajemy go do dokumentu
    } else if (idx % 3 === 1) {
      specializationsField = { specializations: [] };
    } else {
      specializationsField = {
        specializations: faker.helpers.arrayElements(
          SPECIALIZATIONS,
          faker.number.int({ min: 1, max: 4 })
        ),
      };
    }

    // recentIncidents — max 5, na bazie missionsCount
    const incidentCount = Math.min(hero.missionsCount, 5);
    const recentIncidents = Array.from({ length: incidentCount }, (_, i) => ({
      incidentId: faker.number.int({ min: 1, max: 60 }),
      level:      faker.helpers.arrayElement(LEVELS),
      location:   faker.location.streetAddress(),
      // daty wstecz — ostatni incydent najpóźniejszy
      resolvedAt: new Date(now.getTime() - (incidentCount - i) * 24 * 3_600_000),
    }));

    const criticalMissions = recentIncidents.filter((i) => i.level === 'critical').length +
      Math.floor(hero.missionsCount * 0.2);
    const lastMissionAt    = hero.missionsCount > 0
      ? new Date(now.getTime() - faker.number.int({ min: 1, max: 30 }) * 3_600_000)
      : null;

    return {
      heroId:   hero.id,
      heroName: hero.name,
      power:    hero.power,
      ...(hasBio && { bio: faker.lorem.sentences(2) }),
      ...specializationsField,
      recentIncidents,
      stats: {
        // totalMissions spójne z missionsCount z PostgreSQL — źródło prawdy
        totalMissions:    hero.missionsCount,
        criticalMissions: Math.min(criticalMissions, hero.missionsCount),
        lastMissionAt,
      },
      deletedAt: null,
      createdAt: hero.createdAt,
      updatedAt: now,
    };
  });

  // 5. Wstaw jednym wywołaniem insertMany (nie pętlą insertOne)
  const result = await col.insertMany(profiles);
  console.log(`Seeded ${result.insertedCount} hero profiles into MongoDB (heroProfiles)`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await client.close();
  });
