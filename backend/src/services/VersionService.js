const Version = require('../models/Version');
const { client } = require('../config/redis');

const CACHE_TTL = 60;

function cacheKey(userId) {
  return `versions:user:${userId}`;
}

async function getVersionsByUser(userId) {
  const key = cacheKey(userId);

  if (client.isOpen) {
    const cached = await client.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
  }

  const versions = await Version.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
  });

  if (client.isOpen) {
    await client.set(key, JSON.stringify(versions), { EX: CACHE_TTL });
  }

  return versions;
}

async function createVersion(data, userId) {
  const version = await Version.create({
    name: data.name,
    description: data.description,
    userId,
  });

  if (client.isOpen) {
    await client.del(cacheKey(userId));
  }

  return version;
}

async function removeVersion(versionId, userId) {
  const version = await Version.findOne({ where: { id: versionId, userId } });
  if (!version) {
    return null;
  }

  await version.destroy();

  if (client.isOpen) {
    await client.del(cacheKey(userId));
  }

  return version;
}

module.exports = {
  cacheKey,
  getVersionsByUser,
  createVersion,
  removeVersion,
};
