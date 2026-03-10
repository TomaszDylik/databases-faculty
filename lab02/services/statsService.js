const heroRepository = require('../repositories/heroRepository');
const incidentRepository = require('../repositories/incidentRepository');

function mapGroupedCounts(rows, keyField) {
  return rows.reduce((accumulator, row) => {
    accumulator[row[keyField]] = parseInt(row.count, 10);
    return accumulator;
  }, {});
}

function calculateAverageResolutionMinutes(rows) {
  if (rows.length === 0) {
    return 0;
  }

  const totalMinutes = rows.reduce((sum, row) => {
    const assignedAt = new Date(row.assigned_at).getTime();
    const resolvedAt = new Date(row.resolved_at).getTime();
    return sum + (resolvedAt - assignedAt) / 60000;
  }, 0);

  return Number((totalMinutes / rows.length).toFixed(2));
}

async function getStats() {
  const [
    heroTotal,
    heroStatusCounts,
    heroPowerCounts,
    incidentTotal,
    incidentStatusCounts,
    incidentLevelCounts,
    resolvedDurations,
  ] = await Promise.all([
    heroRepository.countAll(),
    heroRepository.countByStatus(),
    heroRepository.countByPower(),
    incidentRepository.countAll(),
    incidentRepository.countByStatus(),
    incidentRepository.countByLevel(),
    incidentRepository.findResolvedDurations(),
  ]);

  return {
    heroes: {
      total: heroTotal,
      byStatus: mapGroupedCounts(heroStatusCounts, 'status'),
      byPower: mapGroupedCounts(heroPowerCounts, 'power'),
    },
    incidents: {
      total: incidentTotal,
      byStatus: mapGroupedCounts(incidentStatusCounts, 'status'),
      byLevel: mapGroupedCounts(incidentLevelCounts, 'level'),
      averageResolutionMinutes: calculateAverageResolutionMinutes(resolvedDurations),
    },
  };
}

module.exports = { getStats };