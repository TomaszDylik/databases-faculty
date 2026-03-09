/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .alterTable('heroes', table => {
      table.integer('missions_count').notNullable().defaultTo(0);
    })
    .alterTable('incidents', table => {
      table.string('district');
      table.datetime('assigned_at');
      table.datetime('resolved_at');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .alterTable('incidents', table => {
      table.dropColumn('district');
      table.dropColumn('assigned_at');
      table.dropColumn('resolved_at');
    })
    .alterTable('heroes', table => {
      table.dropColumn('missions_count');
    });
};