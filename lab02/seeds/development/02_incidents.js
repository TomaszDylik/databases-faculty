const { faker } = require('@faker-js/faker');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  faker.seed(7);
  
  // id wszytskich heros z bazy
  const heroes = await knex('heroes').select('id');
  const heroIds = heroes.map(h => h.id);
  
  const levels = ['low', 'medium', 'critical'];
  const statuses = ['open', 'assigned', 'resolved'];
  
  const incidents = [];
  for (let i = 0; i < 60; i++) {
    const status = faker.helpers.arrayElement(statuses);
    
    let hero_id = null;
    let assigned_at = null;
    let resolved_at = null;
    
    // jesli incydent nie jest open - przypisujemy mu bohatera i czas
    if (status !== 'open') {
      hero_id = faker.helpers.arrayElement(heroIds);
      assigned_at = faker.date.recent();
      
      // jesli incydent jest resolved - dodajemy czas rozwiązania (późniejszy niż przypisania)
      if (status === 'resolved') {
        resolved_at = faker.date.between({ from: assigned_at, to: new Date() });
      }
    }
    
    incidents.push({
      location: faker.location.streetAddress(),
      district: faker.location.county(),
      level: faker.helpers.arrayElement(levels),
      status: status,
      hero_id: hero_id,
      assigned_at: assigned_at,
      resolved_at: resolved_at
    });
  }
  
  await knex('incidents').insert(incidents);
};