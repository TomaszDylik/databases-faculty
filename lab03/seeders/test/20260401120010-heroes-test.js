'use strict';

const now = new Date();

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Jawne id — pokrywa wszystkie kombinacje statusów i mocy
    await queryInterface.bulkInsert('heroes', [
      { id: 1, name: 'Tester Lotnik',       power: 'flight',      status: 'available', missions_count: 0,   created_at: now, updated_at: now },
      { id: 2, name: 'Tester Siłacz',        power: 'strength',    status: 'busy',      missions_count: 5,   created_at: now, updated_at: now },
      { id: 3, name: 'Tester Szybki',        power: 'speed',       status: 'available', missions_count: 2,   created_at: now, updated_at: now },
      { id: 4, name: 'Tester Telepata',      power: 'telepathy',   status: 'retired',   missions_count: 100, created_at: now, updated_at: now },
      { id: 5, name: 'Tester Niewidzialny',  power: 'invisibility',status: 'busy',      missions_count: 1,   created_at: now, updated_at: now },
    ]);

    // Resetujemy sekwencję PostgreSQL po wstawieniu z jawnymi id
    await queryInterface.sequelize.query(
      "SELECT setval('heroes_id_seq', (SELECT MAX(id) FROM heroes))"
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('heroes', null, { truncate: true, cascade: true, restartIdentity: true });
  },
};
