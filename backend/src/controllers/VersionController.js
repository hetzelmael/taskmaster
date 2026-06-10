const { body, param, validationResult } = require('express-validator');
const VersionService = require('../services/VersionService');

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
  const versions = await VersionService.getVersionsByUser(req.userId);
  res.json(versions);
};

exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const version = await VersionService.createVersion(
    {
      name: req.body.name.trim(),
      description: req.body.description?.trim() || null,
    },
    req.userId
  );

  res.status(201).json(version);
};

exports.remove = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const version = await VersionService.removeVersion(req.params.id, req.userId);
  if (!version) {
    return res.status(404).json({ error: 'Version non trouvée' });
  }

  res.status(204).send();
};
