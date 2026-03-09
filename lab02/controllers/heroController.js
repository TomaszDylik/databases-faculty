const heroService = require('../services/heroService');

async function listHeroes(req, res, next) {
  try {
    const { status, power } = req.query;
    const heroes = await heroService.listHeroes({ status, power });
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
