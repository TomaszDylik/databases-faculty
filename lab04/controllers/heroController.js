const heroService = require('../services/heroService');

async function listHeroes(req, res, next) {
  try {
    const { status, power, sortBy, sortDir } = req.query;
    const page     = req.query.page     ? parseInt(req.query.page, 10)     : undefined;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize, 10) : undefined;
    const heroes   = await heroService.listHeroes({ status, power, sortBy, sortDir, page, pageSize });
    res.status(200).json(heroes);
  } catch (err) { next(err); }
}

async function getHeroById(req, res, next) {
  try {
    const hero = await heroService.getHeroById(Number(req.params.id));
    res.status(200).json(hero);
  } catch (err) { next(err); }
}

async function createHero(req, res, next) {
  try {
    const { name, power } = req.body;
    const hero = await heroService.createHero({ name, power });
    res.set('Location', `/api/v1/heroes/${hero.id}`);
    res.status(201).json(hero);
  } catch (err) { next(err); }
}

async function updateHero(req, res, next) {
  try {
    const hero = await heroService.updateHero(Number(req.params.id), req.body);
    res.status(200).json(hero);
  } catch (err) { next(err); }
}

async function listHeroIncidents(req, res, next) {
  try {
    const heroId   = Number(req.params.id);
    const page     = req.query.page     ? parseInt(req.query.page, 10)     : undefined;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize, 10) : undefined;
    const incidents = await heroService.listHeroIncidents(heroId, { page, pageSize });
    res.status(200).json(incidents);
  } catch (err) { next(err); }
}

module.exports = { listHeroes, getHeroById, createHero, updateHero, listHeroIncidents };
