const heroRepository = require('../repositories/heroRepository');
const incidentRepository = require('../repositories/incidentRepository');

function mapGroupedCounts(rows, keyField) {
  return rows.reduce((accumulator, row) => {
    accumulator[row[keyField]] = parseInt(row.count, 10);
    return accumulator;
  }, {});
}

async function getStats() {
  const [
    heroTotal,
    heroStatusCounts,
    heroPowerCounts,
    incidentTotal,
    incidentStatusCounts,
    incidentLevelCounts,
    averageResolutionMinutes,
  ] = await Promise.all([
    heroRepository.countAll(),
    heroRepository.countByStatus(),
    heroRepository.countByPower(),
    incidentRepository.countAll(),
    incidentRepository.countByStatus(),
    incidentRepository.countByLevel(),
    incidentRepository.getAverageResolutionMinutes(),
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
      averageResolutionMinutes,
    },
  };
}

module.exports = { getStats };