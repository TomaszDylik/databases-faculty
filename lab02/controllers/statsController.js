const statsService = require('../services/statsService');

async function getStats(req, res, next) {
  try {
    const stats = await statsService.getStats();
    res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
}

module.exports = { getStats };