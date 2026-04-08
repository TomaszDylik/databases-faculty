/**
 * services/profileService.js — warstwa dostępu do MongoDB (kolekcja heroProfiles)
 *
 * Wszystkie operacje filtrują { deletedAt: null } — tylko aktywne profile.
 * Projekcja wyłączna { deletedAt: 0 } sprawia, że pole deletedAt nigdy nie trafia do odpowiedzi JSON.
 * Soft-delete i wpis do heroAuditLog są atomowe przez withTransaction (wymaga replica set).
 */
const { heroProfiles, heroAuditLog, client } = require('../mongo/client');
const { NotFoundError }                      = require('./errors');

// Wyłączna projekcja — deletedAt nie pojawia się w żadnej odpowiedzi API
const EXCLUDE_DELETED_AT = { deletedAt: 0 };

async function getProfile(heroId) {
  const profile = await heroProfiles().findOne(
    { heroId, deletedAt: null },
    { projection: EXCLUDE_DELETED_AT }
  );
  if (!profile) throw new NotFoundError(`Profile for hero ${heroId} not found or soft-deleted`);
  return profile;
}

async function listProfiles({ powers, minMissions, withBio, specialization, page = 1, limit = 10 } = {}) {
  // Budowanie filtra MongoDB
  const filter = { deletedAt: null };

  if (powers) {
    // Lista po przecinku → $in
    const powerList = powers.split(',').map((p) => p.trim()).filter(Boolean);
    if (powerList.length > 0) filter.power = { $in: powerList };
  }
  if (minMissions !== undefined) {
    // $gte na zagnieżdżonym polu stats.totalMissions
    filter['stats.totalMissions'] = { $gte: Number(minMissions) };
  }
  if (withBio === 'true') {
    // $exists: true — dokument musi mieć pole bio
    filter.bio = { $exists: true };
  }
  if (specialization) {
    // Dopasowanie elementu w tablicy — Mongo sprawdza czy specializations zawiera daną wartość
    filter.specializations = specialization;
  }

  const skip = (page - 1) * limit;

  const [total, data] = await Promise.all([
    heroProfiles().countDocuments(filter),
    heroProfiles()
      .find(filter, { projection: EXCLUDE_DELETED_AT })
      .sort({ 'stats.totalMissions': -1 })  // malejąco po totalMissions
      .skip(skip)
      .limit(limit)
      .toArray(),
  ]);

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

async function updateBio(heroId, bio) {
  // $set — aktualizuje tylko pole bio, nie zastępuje całego dokumentu
  const profile = await heroProfiles().findOneAndUpdate(
    { heroId, deletedAt: null },
    { $set: { bio, updatedAt: new Date() } },
    { returnDocument: 'after', projection: EXCLUDE_DELETED_AT }
  );
  if (!profile) throw new NotFoundError(`Profile for hero ${heroId} not found or soft-deleted`);
  return profile;
}

async function addSpecialization(heroId, name) {
  // $addToSet — nie dodaje duplikatu jeśli wartość już istnieje
  const profile = await heroProfiles().findOneAndUpdate(
    { heroId, deletedAt: null },
    { $addToSet: { specializations: name }, $set: { updatedAt: new Date() } },
    { returnDocument: 'after', projection: EXCLUDE_DELETED_AT }
  );
  if (!profile) throw new NotFoundError(`Profile for hero ${heroId} not found or soft-deleted`);
  return profile;
}

async function removeSpecialization(heroId, name) {
  // $pull — usuwa wszystkie elementy tablicy równe `name`
  const profile = await heroProfiles().findOneAndUpdate(
    { heroId, deletedAt: null },
    { $pull: { specializations: name }, $set: { updatedAt: new Date() } },
    { returnDocument: 'after', projection: EXCLUDE_DELETED_AT }
  );
  if (!profile) throw new NotFoundError(`Profile for hero ${heroId} not found or soft-deleted`);
  return profile;
}

async function softDeleteProfile(heroId) {
  // Weryfikacja przed transakcją — żeby rzucić 404 przed otwarciem sesji
  const existing = await heroProfiles().findOne({ heroId, deletedAt: null });
  if (!existing) throw new NotFoundError(`Profile for hero ${heroId} not found or already deleted`);

  // withTransaction wymaga replica set (rs0)
  // Każda operacja musi otrzymać { session } — inaczej nie bierze udziału w transakcji
  // Rzucenie wyjątku w callbacku powoduje automatyczny rollback obu operacji
  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      // 1. Soft-delete — ustawia deletedAt zamiast fizycznie usuwać
      await heroProfiles().updateOne(
        { heroId },
        { $set: { deletedAt: new Date(), updatedAt: new Date() } },
        { session }
      );

      // 2. Wpis do audit logu — atomowy z soft-delete
      await heroAuditLog().insertOne(
        {
          heroId,
          action:    'profile_deleted',
          timestamp: new Date(),
        },
        { session }
      );
    });
  } finally {
    // session.endSession() wywołany zawsze — niezależnie od wyniku transakcji
    await session.endSession();
  }
}

async function updateProfileAfterResolve(heroId, incident) {
  // Wywoływany po commicie transakcji Prisma — bez sesji (operacja jednorazowa)
  const inc = { 'stats.totalMissions': 1 };
  if (incident.level === 'critical') {
    // +1 criticalMissions tylko dla incydentów krytycznych
    inc['stats.criticalMissions'] = 1;
  }

  await heroProfiles().updateOne(
    { heroId, deletedAt: null },
    {
      // $push z $each i $slice: -5 — dodaje element i zachowuje tylko 5 ostatnich
      $push: {
        recentIncidents: {
          $each: [{
            incidentId: incident.id,
            level:      incident.level,
            location:   incident.location,
            resolvedAt: new Date(),
          }],
          $slice: -5,
        },
      },
      $inc: inc,
      $set: {
        'stats.lastMissionAt': new Date(),
        updatedAt:             new Date(),
      },
    }
  );
}

module.exports = {
  getProfile,
  listProfiles,
  updateBio,
  addSpecialization,
  removeSpecialization,
  softDeleteProfile,
  updateProfileAfterResolve,
};
