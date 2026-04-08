/**
 * mongo/client.js — singleton MongoClient
 *
 * Eksportuje:
 *   client        — instancja MongoClient (jeden na cały proces)
 *   heroProfiles()  — referencja do kolekcji heroProfiles
 *   heroAuditLog()  — referencja do kolekcji heroAuditLog
 *
 * URI pochodzi z MONGODB_URI w .env.
 * Połączenie jest nawiązywane przez app.js przy starcie serwera (client.connect()).
 * seed.js sam wywołuje client.connect() i client.close().
 */
require('dotenv').config({ path: `${__dirname}/../.env` });
const { MongoClient } = require('mongodb');

const uri    = process.env.MONGODB_URI;
const client = new MongoClient(uri);

function heroProfiles() {
  return client.db().collection('heroProfiles');
}

function heroAuditLog() {
  return client.db().collection('heroAuditLog');
}

module.exports = { client, heroProfiles, heroAuditLog };
