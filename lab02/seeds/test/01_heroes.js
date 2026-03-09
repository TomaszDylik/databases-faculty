exports.seed = async function(knex) {
  await knex('heroes').insert([
    { id: 1, name: 'Tester Lotnik', power: 'flight', status: 'available', missions_count: 0 },
    { id: 2, name: 'Tester Siłacz', power: 'strength', status: 'busy', missions_count: 5 },
    { id: 3, name: 'Tester Szybki', power: 'speed', status: 'available', missions_count: 2 },
    { id: 4, name: 'Tester Telepata', power: 'telepathy', status: 'retired', missions_count: 100 },
    { id: 5, name: 'Tester Niewidzialny', power: 'invisibility', status: 'busy', missions_count: 1 }
  ]);
};