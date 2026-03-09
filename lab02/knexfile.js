require('dotenv').config(); // zmienne środowiskowe z pliku .env

module.exports = {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: './migrations',
    },
    seeds: {
      directory: './seeds/development',
    },
  },

  test: {
    client: 'pg',
    connection: process.env.TEST_DATABASE_URL, // inna baza danych dla testów
    migrations: {
      directory: './migrations',
    },
    seeds: {
      directory: './seeds/test',
    },
  },
};