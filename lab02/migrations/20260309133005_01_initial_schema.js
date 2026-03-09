/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasHeroes = await knex.schema.hasTable('heroes');
  if (!hasHeroes) {
    await knex.schema.createTable('heroes', table => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.enum('power', ['flight', 'strength', 'telepathy', 'speed', 'invisibility']).notNullable();
      table.enum('status', ['available', 'busy']).notNullable().defaultTo('available');
      table.timestamps(true, true);
    });
  }

  const hasIncidents = await knex.schema.hasTable('incidents');
  if (!hasIncidents) {
    await knex.schema.createTable('incidents', table => {
      table.increments('id').primary();
      table.string('location').notNullable();
      table.enum('level', ['low', 'medium', 'critical']).notNullable();
      table.enum('status', ['open', 'assigned', 'resolved']).notNullable().defaultTo('open');
      table.integer('hero_id').unsigned().references('id').inTable('heroes').onDelete('SET NULL');
      table.timestamps(true, true);
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('incidents')
    .dropTableIfExists('heroes');
};