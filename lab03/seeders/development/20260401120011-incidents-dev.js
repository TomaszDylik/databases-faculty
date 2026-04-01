'use strict';

const { faker } = require('@faker-js/faker');

const BASE_ASSIGNED_AT = new Date('2026-01-01T08:00:00.000Z');

function offsetDate(baseDate, minutesToAdd) {
  return new Date(baseDate.getTime() + minutesToAdd * 60000);
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    faker.seed(7);

    const heroes = await queryInterface.sequelize.query(
      'SELECT id, power FROM heroes',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const availableHeroIds      = new Set(heroes.map((h) => h.id));
    const criticalEligibleHeroIds = heroes
      .filter((h) => h.power === 'flight' || h.power === 'strength')
      .map((h) => h.id);

    const levels        = ['low', 'medium', 'critical'];
    const statuses      = ['open', 'assigned', 'resolved'];
    const busyHeroIds   = new Set();
    const now           = new Date();
    const incidents     = [];

    for (let i = 0; i < 60; i++) {
      const level = faker.helpers.arrayElement(levels);
      let status  = faker.helpers.arrayElement(statuses);

      let hero_id            = null;
      let assigned_at        = null;
      let resolved_at        = null;
      let resolution_minutes = null;

      if (status !== 'open') {
        const candidateIds = level === 'critical'
          ? criticalEligibleHeroIds.filter((id) => availableHeroIds.has(id) || status === 'resolved')
          : heroes.map((h) => h.id).filter((id) => availableHeroIds.has(id) || status === 'resolved');

        if (candidateIds.length === 0) {
          status = 'open';
        } else {
          hero_id     = faker.helpers.arrayElement(candidateIds);
          assigned_at = offsetDate(BASE_ASSIGNED_AT, i * 17 + 5);

          if (status === 'assigned') {
            availableHeroIds.delete(hero_id);
            busyHeroIds.add(hero_id);
          }

          if (status === 'resolved') {
            resolved_at        = offsetDate(assigned_at, (i % 9 + 1) * 13);
            resolution_minutes = Number(
              ((resolved_at.getTime() - assigned_at.getTime()) / 60000).toFixed(2)
            );
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
        created_at: now,
        updated_at: now,
      });
    }

    await queryInterface.bulkInsert('incidents', incidents);

    // Aktualizacja statusu bohaterów, którzy mają przypisane incydenty
    if (busyHeroIds.size > 0) {
      await queryInterface.sequelize.query(
        `UPDATE heroes SET status = 'busy', updated_at = NOW() WHERE id IN (${Array.from(busyHeroIds).join(',')})`,
      );
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('incidents', null, { truncate: true, cascade: true, restartIdentity: true });
  },
};
