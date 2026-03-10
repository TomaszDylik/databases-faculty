const heroService = require('../services/heroService');

async function listHeroes(req, res, next) {
  try {
    const { status, power, sortBy, sortDir } = req.query;
    const page = req.query.page ? parseInt(req.query.page, 10) : undefined;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize, 10) : undefined;
    const heroes = await heroService.listHeroes({ status, power, sortBy, sortDir, page, pageSize });
    res.status(200).json(heroes);
  } catch (err) {
    next(err);
  }
}

async function createHero(req, res, next) {
  try {
    const { name, power } = req.body;
    const hero = await heroService.createHero({ name, power });
    res.set('Location', `/api/v1/heroes/${hero.id}`);
    res.status(201).json(hero);
  } catch (err) {
    next(err);
  }
}

module.exports = { listHeroes, createHero };
