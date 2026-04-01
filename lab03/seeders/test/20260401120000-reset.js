'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query('TRUNCATE TABLE incidents RESTART IDENTITY CASCADE');
    await queryInterface.sequelize.query('TRUNCATE TABLE heroes RESTART IDENTITY CASCADE');
  },

  async down() {},
};
