'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // disable FK checks temporarily so truncation order does not matter
    await queryInterface.sequelize.query('TRUNCATE TABLE incidents RESTART IDENTITY CASCADE');
    await queryInterface.sequelize.query('TRUNCATE TABLE heroes RESTART IDENTITY CASCADE');
  },

  async down() {
    // nothing to undo for a reset seeder
  },
};
