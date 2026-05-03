const { body, param, validationResult } = require('express-validator');
const { fn, col } = require('sequelize');
const { Project, Task } = require('../models');

exports.createValidators = [
  body('name').isString().trim().isLength({ min: 1, max: 255 }).withMessage('Nom requis'),
  body('description').optional({ nullable: true }).isString().trim(),
];

exports.updateValidators = [
  param('id').isInt({ min: 1 }),
  body('name').optional().isString().trim().isLength({ min: 1, max: 255 }),
  body('description').optional({ nullable: true }).isString().trim(),
];

exports.list = async (req, res) => {
  const projects = await Project.findAll({
    where: { userId: req.userId },
    order: [['createdAt', 'DESC']],
  });

  const result = await Promise.all(projects.map(async p => {
    const stats = await Task.findAll({
      where: { projectId: p.id },
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    });
    const taskCounts = { todo: 0, in_progress: 0, done: 0, archived: 0 };
    stats.forEach(s => { taskCounts[s.status] = parseInt(s.count); });
    return { ...p.toJSON(), taskCounts };
  }));

  res.json(result);
};

exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const project = await Project.create({
    name: req.body.name.trim(),
    description: req.body.description?.trim() || null,
    userId: req.userId,
  });
  res.status(201).json(project);
};

exports.update = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const project = await Project.findOne({ where: { id: req.params.id, userId: req.userId } });
  if (!project) return res.status(404).json({ error: 'Projet non trouvé' });
  await project.update({
    name:        req.body.name        !== undefined ? req.body.name.trim()               : project.name,
    description: req.body.description !== undefined ? (req.body.description?.trim() || null) : project.description,
  });
  res.json(project);
};

exports.remove = async (req, res) => {
  const project = await Project.findOne({ where: { id: req.params.id, userId: req.userId } });
  if (!project) return res.status(404).json({ error: 'Projet non trouvé' });
  await project.destroy();
  res.status(204).send();
};
