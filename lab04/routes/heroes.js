const { Router } = require('express');
const { listHeroes, getHeroById, createHero, updateHero, listHeroIncidents } = require('../controllers/heroController');

const router = Router();
router.get('/',              listHeroes);
router.get('/:id',           getHeroById);
router.post('/',             createHero);
router.patch('/:id',         updateHero);
router.get('/:id/incidents', listHeroIncidents);

module.exports = router;
