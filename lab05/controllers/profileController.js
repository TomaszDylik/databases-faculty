const profileService = require('../services/profileService');

async function getProfile(req, res, next) {
  try {
    const profile = await profileService.getProfile(Number(req.params.id));
    res.status(200).json(profile);
  } catch (err) { next(err); }
}

async function listProfiles(req, res, next) {
  try {
    const { powers, minMissions, withBio, specialization } = req.query;
    const page  = req.query.page  ? parseInt(req.query.page, 10)  : 1;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
    const result = await profileService.listProfiles({ powers, minMissions, withBio, specialization, page, limit });
    res.status(200).json(result);
  } catch (err) { next(err); }
}

async function updateProfile(req, res, next) {
  try {
    const heroId  = Number(req.params.id);
    const { bio } = req.body;
    const profile = await profileService.updateBio(heroId, bio);
    res.status(200).json(profile);
  } catch (err) { next(err); }
}

async function addSpecialization(req, res, next) {
  try {
    const heroId  = Number(req.params.id);
    const { name } = req.body;
    const profile = await profileService.addSpecialization(heroId, name);
    res.status(200).json(profile);
  } catch (err) { next(err); }
}

async function removeSpecialization(req, res, next) {
  try {
    const heroId = Number(req.params.id);
    const name   = req.params.name;
    const profile = await profileService.removeSpecialization(heroId, name);
    res.status(200).json(profile);
  } catch (err) { next(err); }
}

async function deleteProfile(req, res, next) {
  try {
    await profileService.softDeleteProfile(Number(req.params.id));
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = { getProfile, listProfiles, updateProfile, addSpecialization, removeSpecialization, deleteProfile };
