require('dotenv').config({ path: `${__dirname}/../.env` });

const { Sequelize } = require('sequelize');
const defineHero     = require('./hero');
const defineIncident = require('./incident');

const env    = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];

const sequelize = new Sequelize(config.url, {
  dialect: config.dialect,
  logging: config.logging ?? false,
});

const Hero     = defineHero(sequelize);
const Incident = defineIncident(sequelize);

// declare associations here — models stay clean, sequelize resolves them at runtime
Hero.hasMany(Incident,    { foreignKey: 'hero_id', as: 'incidents' });
Incident.belongsTo(Hero,  { foreignKey: 'hero_id', as: 'hero' });

module.exports = { sequelize, Hero, Incident };
