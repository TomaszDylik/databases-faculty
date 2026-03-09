// domyslnie development
const environment = process.env.NODE_ENV || 'development'; 

// pobranie konfiguracji dla aktualnego środowiska
const config = require('../knexfile.js')[environment]; 

// utworzenie instancji knex 
const knex = require('knex')(config);

// eksport instancji knex
module.exports = knex;