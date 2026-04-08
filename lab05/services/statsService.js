const prisma = require('../prisma/client');

async function getStats() {
  const [
    heroTotalResult,
    heroStatusRows,
    heroPowerRows,
    incidentTotalResult,
    incidentStatusRows,
    incidentLevelRows,
    avgResult,
  ] = await Promise.all([
    prisma.$queryRaw`SELECT COUNT(id)::int AS total FROM heroes`,
    prisma.$queryRaw`SELECT status::text, COUNT(id)::int AS count FROM heroes GROUP BY status ORDER BY status`,
    prisma.$queryRaw`SELECT power::text,  COUNT(id)::int AS count FROM heroes GROUP BY power  ORDER BY power`,
    prisma.$queryRaw`SELECT COUNT(id)::int AS total FROM incidents`,
    prisma.$queryRaw`SELECT status::text, COUNT(id)::int AS count FROM incidents GROUP BY status ORDER BY status`,
    prisma.$queryRaw`SELECT level::text,  COUNT(id)::int AS count FROM incidents GROUP BY level  ORDER BY level`,
    prisma.$queryRaw`SELECT AVG(resolution_minutes)::float AS avg FROM incidents WHERE status = 'resolved' AND resolution_minutes IS NOT NULL`,
  ]);

  function toMap(rows, key) {
    return rows.reduce((acc, row) => {
      acc[row[key]] = Number(row.count);
      return acc;
    }, {});
  }

  return {
    heroes: {
      total:    Number(heroTotalResult[0].total),
      byStatus: toMap(heroStatusRows, 'status'),
      byPower:  toMap(heroPowerRows, 'power'),
    },
    incidents: {
      total:                    Number(incidentTotalResult[0].total),
      byStatus:                 toMap(incidentStatusRows, 'status'),
      byLevel:                  toMap(incidentLevelRows, 'level'),
      averageResolutionMinutes: avgResult[0]?.avg != null ? parseFloat(avgResult[0].avg) : null,
    },
  };
}

module.exports = { getStats };
