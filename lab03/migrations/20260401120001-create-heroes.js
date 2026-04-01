'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('heroes', {
      id: {
        type:          Sequelize.INTEGER,
        allowNull:     false,
        autoIncrement: true,
        primaryKey:    true,
      },
      name: {
        type:      Sequelize.STRING(120),
        allowNull: false,
        unique:    true,
      },
      power: {
        type:      Sequelize.ENUM('flight', 'strength', 'telepathy', 'speed', 'invisibility'),
        allowNull: false,
      },
      status: {
        type:         Sequelize.ENUM('available', 'busy', 'retired'),
        allowNull:    false,
        defaultValue: 'available',
      },
      missions_count: {
        type:         Sequelize.INTEGER,
        allowNull:    false,
        defaultValue: 0,
      },
      created_at: {
        type:         Sequelize.DATE,
        allowNull:    false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type:         Sequelize.DATE,
        allowNull:    false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('heroes');
    // Usunięcie typów ENUM — PostgreSQL tworzy je jako oddzielne typy
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_heroes_power"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_heroes_status"');
  },
};
