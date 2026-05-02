const { body, param, validationResult } = require('express-validator');
const Task = require('../models/Task');

exports.createValidators = [
  body('title').isString().trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Titre requis (1 à 200 caractères)'),
  body('priority').optional().isIn(['low', 'medium', 'high']),
];

exports.updateValidators = [
  param('id').isInt({ min: 1 }),
  body('title').optional().isString().trim().isLength({ min: 1, max: 200 }),
  body('done').optional().isBoolean(),
  body('priority').optional().isIn(['low', 'medium', 'high']),
];

exports.list = async (req, res) => {
  const tasks = await Task.findAll({
    where: { userId: req.userId },
    order: [['createdAt', 'DESC']],
  });
  return res.json(tasks);
};

exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const task = await Task.create({
    userId: req.userId,
    title: req.body.title,
    priority: req.body.priority || 'medium',
    done: false,
  });
  return res.status(201).json(task);
};

exports.update = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const task = await Task.findOne({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!task) {
    return res.status(404).json({ error: 'Tâche introuvable' });
  }
  if (req.body.title !== undefined) task.title = req.body.title;
  if (req.body.done !== undefined) task.done = req.body.done;
  if (req.body.priority !== undefined) task.priority = req.body.priority;
  await task.save();
  return res.json(task);
};

exports.remove = async (req, res) => {
  const deleted = await Task.destroy({
    where: { id: req.params.id, userId: req.userId },
  });
  if (deleted === 0) {
    return res.status(404).json({ error: 'Tâche introuvable' });
  }
  return res.status(204).send();
};
