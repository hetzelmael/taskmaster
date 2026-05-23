const { body, param, validationResult } = require('express-validator');
const taskService = require('../services/TaskService');

exports.createValidators = [
  body('title')
    .isString()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Titre requis (1 à 255 caractères)'),
  body('description').optional().isString().trim(),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('dueDate').optional({ nullable: true }).isISO8601().withMessage('Date invalide'),
];

exports.updateValidators = [
  param('id').isInt({ min: 1 }),
  body('title').optional().isString().trim().isLength({ min: 1, max: 255 }),
  body('status').optional().isIn(['todo', 'in_progress', 'done', 'archived']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('description').optional().isString().trim(),
  body('dueDate').optional({ nullable: true }).isISO8601(),
  body('versionId').optional({ nullable: true }).isInt({ min: 1 }),
];

exports.getByIdValidators = [param('id').isInt({ min: 1 })];

exports.list = async (req, res) => {
  const { status, priority, versionId, projectId, page = 1, limit = 20 } = req.query;
  const result = await taskService.getTasksByUser(req.userId, {
    status,
    priority,
    versionId,
    projectId,
    page: parseInt(page),
    limit: parseInt(limit),
  });
  return res.json(result);
};

exports.getById = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const task = await taskService.getTaskById(parseInt(req.params.id, 10), req.userId);
    return res.json(task);
  } catch (error) {
    return res
      .status(error.status || 500)
      .json({ error: error.message || 'Erreur serveur interne' });
  }
};

exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const task = await taskService.createTask(req.body, req.userId);
  return res.status(201).json(task);
};

exports.update = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const task = await taskService.updateTask(req.params.id, req.userId, req.body);
  return res.json(task);
};

exports.remove = async (req, res) => {
  await taskService.deleteTask(req.params.id, req.userId);
  return res.status(204).send();
};
