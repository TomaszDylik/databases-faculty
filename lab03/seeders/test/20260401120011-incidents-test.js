'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Jawne id — pokrywa wszystkie kombinacje statusów incydentów
    await queryInterface.bulkInsert('incidents', [
      {
        id: 1, location: 'Centrum', level: 'low',      status: 'open',
        hero_id: null, assigned_at: null, resolved_at: null, resolution_minutes: null,
        created_at: new Date(), updated_at: new Date(),
      },
      {
        id: 2, location: 'Bank',    level: 'critical',  status: 'open',
        hero_id: null, assigned_at: null, resolved_at: null, resolution_minutes: null,
        created_at: new Date(), updated_at: new Date(),
      },
      {
        id: 3, location: 'Szkoła', level: 'medium',    status: 'assigned',
        hero_id: 2,
        assigned_at: new Date('2026-01-10T09:00:00.000Z'),
        resolved_at: null, resolution_minutes: null,
        created_at: new Date(), updated_at: new Date(),
      },
      {
        id: 4, location: 'Metro',  level: 'critical',  status: 'assigned',
        hero_id: 5,
        assigned_at: new Date('2026-01-10T09:30:00.000Z'),
        resolved_at: null, resolution_minutes: null,
        created_at: new Date(), updated_at: new Date(),
      },
      {
        id: 5, location: 'Park',   level: 'low',       status: 'resolved',
        hero_id: 1,
        assigned_at:        new Date('2026-01-09T11:00:00.000Z'),
        resolved_at:        new Date('2026-01-09T11:25:00.000Z'),
        resolution_minutes: 25,
        created_at: new Date(), updated_at: new Date(),
      },
      {
        id: 6, location: 'Muzeum', level: 'medium',    status: 'resolved',
        hero_id: 3,
        assigned_at:        new Date('2026-01-09T12:00:00.000Z'),
        resolved_at:        new Date('2026-01-09T12:40:00.000Z'),
        resolution_minutes: 40,
        created_at: new Date(), updated_at: new Date(),
      },
      {
        id: 7, location: 'Port',   level: 'critical',  status: 'open',
        hero_id: null, assigned_at: null, resolved_at: null, resolution_minutes: null,
        created_at: new Date(), updated_at: new Date(),
      },
      {
        id: 8, location: 'Sklep',  level: 'low',       status: 'open',
        hero_id: null, assigned_at: null, resolved_at: null, resolution_minutes: null,
        created_at: new Date(), updated_at: new Date(),
      },
    ]);

    // Resetujemy sekwencję PostgreSQL po wstawieniu z jawnymi id
    await queryInterface.sequelize.query(
      "SELECT setval('incidents_id_seq', (SELECT MAX(id) FROM incidents))"
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('incidents', null, { truncate: true, cascade: true, restartIdentity: true });
  },
};
