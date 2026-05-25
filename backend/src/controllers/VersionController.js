const { body, param, validationResult } = require('express-validator');
const { Version } = require('../models');
const { client } = require('../config/redis');

const CACHE_TTL = 60; // secondes

function cacheKey(userId) {
  return `versions:user:${userId}`;
}

exports.createValidators = [
  body('name')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Nom requis (1 à 100 caractères)'),
  body('description').optional({ nullable: true }).isString().trim(),
];

exports.removeValidators = [param('id').isInt({ min: 1 })];

exports.list = async (req, res) => {
  const key = cacheKey(req.userId);

  // Lecture depuis Redis (cache NoSQL)
  if (client.isOpen) {
    const cached = await client.get(key);
    if (cached) {
      return res.json(JSON.parse(cached));
    }
  }

  // Miss cache → lecture PostgreSQL
  const versions = await Version.findAll({
    where: { userId: req.userId },
    order: [['createdAt', 'DESC']],
  });

  // Écriture dans Redis avec TTL
  if (client.isOpen) {
    await client.set(key, JSON.stringify(versions), { EX: CACHE_TTL });
  }

  res.json(versions);
};

exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const version = await Version.create({
    name: req.body.name.trim(),
    description: req.body.description?.trim() || null,
    userId: req.userId,
  });

  // Invalidation du cache après création
  if (client.isOpen) {
    await client.del(cacheKey(req.userId));
  }

  res.status(201).json(version);
};

exports.remove = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const version = await Version.findOne({ where: { id: req.params.id, userId: req.userId } });
  if (!version) {
    return res.status(404).json({ error: 'Version non trouvée' });
  }

  await version.destroy();

  // Invalidation du cache après suppression
  if (client.isOpen) {
    await client.del(cacheKey(req.userId));
  }

  res.status(204).send();
};
