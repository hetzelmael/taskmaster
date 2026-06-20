const Version = require('../models/Version');
const Project = require('../models/Project');
const { client } = require('../config/redis');

const CACHE_TTL = 60;

function cacheKey(projectId) {
  return `versions:project:${projectId}`;
}

async function getVersionsByProject(projectId, userId) {
  const project = await Project.findOne({ where: { id: projectId, userId } });
  if (!project) { return null; }

  const key = cacheKey(projectId);

  if (client.isOpen) {
    const cached = await client.get(key);
    if (cached) { return JSON.parse(cached); }
  }

  const versions = await Version.findAll({
    where: { projectId },
    order: [['createdAt', 'DESC']],
  });

  if (client.isOpen) {
    await client.set(key, JSON.stringify(versions), { EX: CACHE_TTL });
  }

  return versions;
}

async function createVersion(data, projectId, userId) {
  const project = await Project.findOne({ where: { id: projectId, userId } });
  if (!project) { return null; }

  const version = await Version.create({
    name: data.name,
    description: data.description,
    projectId,
  });

  try {
    if (client.isOpen) {
      await client.del(cacheKey(projectId));
    }
  } catch (_redisErr) { /* dégradation gracieuse si Redis indisponible */ }

  return version;
}

async function removeVersion(versionId, userId) {
  const version = await Version.findOne({
    where: { id: versionId },
    include: [{ model: Project, where: { userId }, required: true }],
  });
  if (!version) { return null; }

  await version.destroy();

  try {
    if (client.isOpen) {
      await client.del(cacheKey(version.projectId));
    }
  } catch (_redisErr) { /* dégradation gracieuse si Redis indisponible */ }

  return version;
}

module.exports = {
  cacheKey,
  getVersionsByProject,
  createVersion,
  removeVersion,
};
