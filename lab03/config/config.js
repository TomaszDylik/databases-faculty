require('dotenv').config({ path: `${__dirname}/../.env` });

module.exports = {
  development: {
    url:     process.env.DATABASE_URL,
    dialect: 'postgres',
    logging: false,
  },
  test: {
    url:     process.env.TEST_DATABASE_URL,
    dialect: 'postgres',
    logging: false,
  },
};
