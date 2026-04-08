const { PrismaClient } = require('@prisma/client');

// singleton — jedna pula połączeń
const prisma = new PrismaClient();

module.exports = prisma;
