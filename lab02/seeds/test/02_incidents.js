exports.seed = async function(knex) {
  await knex('incidents').insert([
    { id: 1, location: 'Centrum', level: 'low', status: 'open', hero_id: null },
    { id: 2, location: 'Bank', level: 'critical', status: 'open', hero_id: null },
    { id: 3, location: 'Szkoła', level: 'medium', status: 'assigned', hero_id: 2, assigned_at: new Date() },
    { id: 4, location: 'Metro', level: 'critical', status: 'assigned', hero_id: 5, assigned_at: new Date() },
    { id: 5, location: 'Park', level: 'low', status: 'resolved', hero_id: 1, assigned_at: new Date(Date.now() - 100000), resolved_at: new Date() },
    { id: 6, location: 'Muzeum', level: 'medium', status: 'resolved', hero_id: 3, assigned_at: new Date(Date.now() - 200000), resolved_at: new Date() },
    { id: 7, location: 'Port', level: 'critical', status: 'open', hero_id: null },
    { id: 8, location: 'Sklep', level: 'low', status: 'open', hero_id: null }
  ]);
};