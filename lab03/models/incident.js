const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Incident extends Model {}

  Incident.init(
    {
      id: {
        type:          DataTypes.INTEGER,
        primaryKey:    true,
        autoIncrement: true,
      },
      location: {
        type:      DataTypes.STRING(200),
        allowNull: false,
      },
      district: {
        type:      DataTypes.STRING(100),
        allowNull: true,
      },
      level: {
        type:      DataTypes.ENUM('low', 'medium', 'critical'),
        allowNull: false,
      },
      status: {
        type:         DataTypes.ENUM('open', 'assigned', 'resolved'),
        allowNull:    false,
        defaultValue: 'open',
      },
      hero_id: {
        type:      DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'heroes', key: 'id' },
        onDelete: 'SET NULL',
      },
      assigned_at: {
        type:      DataTypes.DATE,
        allowNull: true,
      },
      resolved_at: {
        type:      DataTypes.DATE,
        allowNull: true,
      },
      resolution_minutes: {
        type:      DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Incident',
      tableName: 'incidents',
      timestamps: true,
      underscored: true,
      hooks: {
        // fires after instance.update() - increments missions_count when status goes assigned -> resolved
        async afterUpdate(incident, options) {
          if (
            incident.changed('status') &&
            incident.previous('status') === 'assigned' &&
            incident.status === 'resolved' &&
            incident.hero_id
          ) {
            const Hero = sequelize.models.Hero;
            // uses options.transaction from outside - no nested transaction, rollback covers this too
            await Hero.increment('missions_count', {
              by:          1,
              where:       { id: incident.hero_id },
              transaction: options.transaction,
            });
          }
        },
      },
    }
  );

  return Incident;
};
