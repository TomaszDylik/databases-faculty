const { Router } = require('express');
const { listHeroes, createHero } = require('../controllers/heroController');

const router = Router();

router.get('/', listHeroes);
router.post('/', createHero);

module.exports = router;
