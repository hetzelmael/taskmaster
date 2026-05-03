const { body, param, validationResult } = require('express-validator');
const { Version } = require('../models');

exports.createValidators = [
  body('name').isString().trim().isLength({ min: 1, max: 100 }).withMessage('Nom requis (1 à 100 caractères)'),
  body('description').optional({ nullable: true }).isString().trim(),
];

exports.list = async (req, res) => {
  const versions = await Version.findAll({
    where: { userId: req.userId },
    order: [['createdAt', 'DESC']],
  });
  res.json(versions);
};

exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const version = await Version.create({
    name: req.body.name.trim(),
    description: req.body.description?.trim() || null,
    userId: req.userId,
  });
  res.status(201).json(version);
};

exports.remove = async (req, res) => {
  const version = await Version.findOne({ where: { id: req.params.id, userId: req.userId } });
  if (!version) return res.status(404).json({ error: 'Version non trouvée' });
  await version.destroy();
  res.status(204).send();
};
