const incidentService = require('../services/incidentService');

async function listIncidents(req, res, next) {
  try {
    const { level, status, district, categoryId, exclude } = req.query;
    const page     = req.query.page     ? parseInt(req.query.page, 10)     : undefined;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize, 10) : undefined;
    const incidents = await incidentService.listIncidents({ level, status, district, categoryId, exclude, page, pageSize });
    res.status(200).json(incidents);
  } catch (err) { next(err); }
}

async function getIncidentById(req, res, next) {
  try {
    const incident = await incidentService.getIncidentById(Number(req.params.id));
    res.status(200).json(incident);
  } catch (err) { next(err); }
}

async function createIncident(req, res, next) {
  try {
    // categoryIds — opcjonalna tablica id kategorii
    const { location, level, categoryIds } = req.body;
    const incident = await incidentService.createIncident({ location, level, categoryIds });
    res.set('Location', `/api/v1/incidents/${incident.id}`);
    res.status(201).json(incident);
  } catch (err) { next(err); }
}

async function assignHero(req, res, next) {
  try {
    const incidentId = Number(req.params.id);
    const { heroId }  = req.body;
    const incident    = await incidentService.assignHero(incidentId, heroId);
    res.status(200).json(incident);
  } catch (err) { next(err); }
}

async function resolveIncident(req, res, next) {
  try {
    const incident = await incidentService.resolveIncident(Number(req.params.id));
    res.status(200).json(incident);
  } catch (err) { next(err); }
}

module.exports = { listIncidents, getIncidentById, createIncident, assignHero, resolveIncident };
