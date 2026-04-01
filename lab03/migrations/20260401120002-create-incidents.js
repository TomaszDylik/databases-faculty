'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('incidents', {
      id: {
        type:          Sequelize.INTEGER,
        allowNull:     false,
        autoIncrement: true,
        primaryKey:    true,
      },
      location: {
        type:      Sequelize.STRING(200),
        allowNull: false,
      },
      district: {
        type:      Sequelize.STRING(100),
        allowNull: true,
      },
      level: {
        type:      Sequelize.ENUM('low', 'medium', 'critical'),
        allowNull: false,
      },
      status: {
        type:         Sequelize.ENUM('open', 'assigned', 'resolved'),
        allowNull:    false,
        defaultValue: 'open',
      },
      hero_id: {
        type:       Sequelize.INTEGER,
        allowNull:  true,
        references: { model: 'heroes', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'SET NULL',
      },
      assigned_at: {
        type:      Sequelize.DATE,
        allowNull: true,
      },
      resolved_at: {
        type:      Sequelize.DATE,
        allowNull: true,
      },
      resolution_minutes: {
        type:      Sequelize.DECIMAL(10, 2),
        allowNull: true,
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
    await queryInterface.dropTable('incidents');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_incidents_level"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_incidents_status"');
  },
};
