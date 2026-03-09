const { faker } = require('@faker-js/faker');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  faker.seed(7); 
  
  const powers = ['flight', 'strength', 'telepathy', 'speed', 'invisibility'];
  const statuses = ['available', 'busy', 'retired'];
  
  const heroes = [];
  for (let i = 0; i < 20; i++) {
    heroes.push({
      // dodajemy losowy ciąg znakow jako nazwe bohatera
      name: faker.person.fullName() + ' ' + faker.string.alphanumeric(4), 
      power: faker.helpers.arrayElement(powers),
      status: faker.helpers.arrayElement(statuses),
      missions_count: faker.number.int({ min: 0, max: 50 })
    });
  }
  
  await knex('heroes').insert(heroes);
};