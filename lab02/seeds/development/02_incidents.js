const { faker } = require('@faker-js/faker');

const BASE_ASSIGNED_AT = new Date('2026-01-01T08:00:00.000Z');

function offsetDate(baseDate, minutesToAdd) {
  return new Date(baseDate.getTime() + minutesToAdd * 60000);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  faker.seed(7);

  const heroes = await knex('heroes').select('id', 'power');
  const availableHeroIds = new Set(heroes.map((hero) => hero.id));
  const criticalEligibleHeroIds = heroes
    .filter((hero) => hero.power === 'flight' || hero.power === 'strength')
    .map((hero) => hero.id);
  
  const levels = ['low', 'medium', 'critical'];
  const statuses = ['open', 'assigned', 'resolved'];
  const busyHeroIds = new Set();
  
  const incidents = [];
  for (let i = 0; i < 60; i++) {
    const level = faker.helpers.arrayElement(levels);
    let status = faker.helpers.arrayElement(statuses);

    let hero_id = null;
    let assigned_at = null;
    let resolved_at = null;
    let resolution_minutes = null;

    if (status !== 'open') {
      const candidateHeroIds = level === 'critical'
        ? criticalEligibleHeroIds.filter((heroId) => availableHeroIds.has(heroId) || status === 'resolved')
        : heroes
            .map((hero) => hero.id)
            .filter((heroId) => availableHeroIds.has(heroId) || status === 'resolved');

      if (candidateHeroIds.length === 0) {
        status = 'open';
      } else {
        hero_id = faker.helpers.arrayElement(candidateHeroIds);
        assigned_at = offsetDate(BASE_ASSIGNED_AT, i * 17 + 5);

        if (status === 'assigned') {
          availableHeroIds.delete(hero_id);
          busyHeroIds.add(hero_id);
        }

        if (status === 'resolved') {
          resolved_at = offsetDate(assigned_at, (i % 9 + 1) * 13);
          resolution_minutes = Number(((resolved_at.getTime() - assigned_at.getTime()) / 60000).toFixed(2));
        }
      }
    }

    incidents.push({
      location: faker.location.streetAddress(),
      district: faker.location.county(),
      level,
      status,
      hero_id,
      assigned_at,
      resolved_at,
      resolution_minutes,
    });
  }

  await knex('incidents').insert(incidents);

  if (busyHeroIds.size > 0) {
    await knex('heroes')
      .whereIn('id', Array.from(busyHeroIds))
      .update({
        status: 'busy',
        updated_at: knex.fn.now(),
      });
  }
};