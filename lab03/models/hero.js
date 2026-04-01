const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Hero extends Model {}

  Hero.init(
    {
      id: {
        type:          DataTypes.INTEGER,
        primaryKey:    true,
        autoIncrement: true,
      },
      name: {
        type:      DataTypes.STRING(120),
        allowNull: false,
        unique:    true,
      },
      power: {
        type:      DataTypes.ENUM('flight', 'strength', 'telepathy', 'speed', 'invisibility'),
        allowNull: false,
      },
      status: {
        type:         DataTypes.ENUM('available', 'busy', 'retired'),
        allowNull:    false,
        defaultValue: 'available',
      },
      missions_count: {
        type:         DataTypes.INTEGER,
        allowNull:    false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
    },
    {
      sequelize,
      modelName: 'Hero',
      tableName: 'heroes',
      timestamps: true,
      underscored: true,
      scopes: {
        // single source of truth for 'available' filter - repository calls Hero.scope('available')
        available: { where: { status: 'available' } },
        withPower(power) {
          return { where: { power } };
        },
        withMissions: { order: [['missions_count', 'DESC']] },
      },
      hooks: {
        // runs before sequelize validation - guarantees name is trimmed regardless of caller
        beforeValidate(hero) {
          if (typeof hero.name === 'string') {
            hero.name = hero.name.trim();
          }
        },
      },
    }
  );

  return Hero;
};
