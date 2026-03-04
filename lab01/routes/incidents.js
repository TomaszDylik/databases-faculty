const { Router } = require('express');
const {
  listIncidents,
  createIncident,
  assignHero,
  resolveIncident,
} = require('../controllers/incidentController');

const router = Router();

router.get('/', listIncidents);
router.post('/', createIncident);
router.post('/:id/assign', assignHero);
router.patch('/:id/resolve', resolveIncident);

module.exports = router;
