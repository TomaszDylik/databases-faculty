const incidentService = require('../services/incidentService');

async function listIncidents(req, res, next) {
  try {
    const { level, status, district } = req.query;
    const page     = req.query.page     ? parseInt(req.query.page, 10)     : undefined;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize, 10) : undefined;
    const incidents = await incidentService.listIncidents({ level, status, district, page, pageSize });
    res.status(200).json(incidents);
  } catch (err) {
    next(err);
  }
}

async function getIncidentById(req, res, next) {
  try {
    const incidentId = Number(req.params.id);
    const incident   = await incidentService.getIncidentById(incidentId);
    res.status(200).json(incident);
  } catch (err) {
    next(err);
  }
}

async function createIncident(req, res, next) {
  try {
    const { location, level } = req.body;
    const incident = await incidentService.createIncident({ location, level });
    res.set('Location', `/api/v1/incidents/${incident.id}`);
    res.status(201).json(incident);
  } catch (err) {
    next(err);
  }
}

async function assignHero(req, res, next) {
  try {
    const incidentId = Number(req.params.id);
    const { heroId } = req.body;
    const incident   = await incidentService.assignHero(incidentId, heroId);
    res.status(200).json(incident);
  } catch (err) {
    next(err);
  }
}

async function resolveIncident(req, res, next) {
  try {
    const incidentId = Number(req.params.id);
    const incident   = await incidentService.resolveIncident(incidentId);
    res.status(200).json(incident);
  } catch (err) {
    next(err);
  }
}

module.exports = { listIncidents, getIncidentById, createIncident, assignHero, resolveIncident };
