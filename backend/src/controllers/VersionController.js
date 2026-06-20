const { body, param, query, validationResult } = require('express-validator');
const VersionService = require('../services/VersionService');

exports.listValidators = [
  query('projectId').isInt({ min: 1 }).withMessage('projectId requis'),
];

exports.createValidators = [
  body('name')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Nom requis (1 à 100 caractères)'),
  body('description').optional({ nullable: true }).isString().trim(),
  body('projectId').isInt({ min: 1 }).withMessage('projectId requis'),
];

exports.removeValidators = [param('id').isInt({ min: 1 })];

exports.list = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const versions = await VersionService.getVersionsByProject(
      parseInt(req.query.projectId),
      req.userId
    );
    if (versions === null) {
      return res.status(404).json({ error: 'Projet introuvable' });
    }
    return res.json(versions);
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur interne' });
  }
};

exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const version = await VersionService.createVersion(
      {
        name: req.body.name.trim(),
        description: req.body.description?.trim() || null,
      },
      parseInt(req.body.projectId),
      req.userId
    );
    if (version === null) {
      return res.status(404).json({ error: 'Projet introuvable' });
    }
    return res.status(201).json(version);
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur interne' });
  }
};

exports.remove = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const version = await VersionService.removeVersion(req.params.id, req.userId);
    if (!version) {
      return res.status(404).json({ error: 'Version non trouvée' });
    }
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur interne' });
  }
};
