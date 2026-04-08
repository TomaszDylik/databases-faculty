const { Router } = require('express');
const { listHeroes, getHeroById, createHero, updateHero, listHeroIncidents } = require('../controllers/heroController');
const {
  getProfile, listProfiles, updateProfile,
  addSpecialization, removeSpecialization, deleteProfile,
} = require('../controllers/profileController');

const router = Router();

// ── GET /api/v1/heroes/profiles musi być PRZED /:id ──────────────────────────
// Bez tego Express dopasowałby "profiles" jako parametr :id
router.get('/profiles', listProfiles);

// ── CRUD bohaterów (PostgreSQL / Prisma) ─────────────────────────────────────
router.get('/',              listHeroes);
router.get('/:id',           getHeroById);
router.post('/',             createHero);
router.patch('/:id',         updateHero);
router.get('/:id/incidents', listHeroIncidents);

// ── Profile bohaterów (MongoDB) ───────────────────────────────────────────────
router.get('/:id/profile',                          getProfile);
router.patch('/:id/profile',                        updateProfile);
router.post('/:id/profile/specializations',         addSpecialization);
router.delete('/:id/profile/specializations/:name', removeSpecialization);
router.delete('/:id/profile',                       deleteProfile);

module.exports = router;
