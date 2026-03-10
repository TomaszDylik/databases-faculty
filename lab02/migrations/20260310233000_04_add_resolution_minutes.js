/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.alterTable('incidents', table => {
    table.decimal('resolution_minutes', 10, 2);
  });

  const resolvedIncidents = await knex('incidents')
    .select('id', 'assigned_at', 'resolved_at')
    .where('status', 'resolved')
    .whereNotNull('assigned_at')
    .whereNotNull('resolved_at');

  for (const incident of resolvedIncidents) {
    const assignedAt = new Date(incident.assigned_at).getTime();
    const resolvedAt = new Date(incident.resolved_at).getTime();
    const resolutionMinutes = Number(((resolvedAt - assignedAt) / 60000).toFixed(2));

    await knex('incidents')
      .where('id', incident.id)
      .update({ resolution_minutes: resolutionMinutes });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable('incidents', table => {
    table.dropColumn('resolution_minutes');
  });
};