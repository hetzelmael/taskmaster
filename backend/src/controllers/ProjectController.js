const { body, param, validationResult } = require('express-validator');
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');
const { Project } = require('../models');

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
  const projects = await sequelize.query(
    `
      SELECT
        p.id,
        p.name,
        p.description,
        p.user_id AS "userId",
        p.created_at AS "createdAt",
        p.updated_at AS "updatedAt",
        COUNT(t.id)::int AS "totalTasks",
        COUNT(t.id) FILTER (WHERE t.status = 'todo')::int AS "todoTasks",
        COUNT(t.id) FILTER (WHERE t.status = 'in_progress')::int AS "inProgressTasks",
        COUNT(t.id) FILTER (WHERE t.status = 'done')::int AS "doneTasks",
        COUNT(t.id) FILTER (WHERE t.status = 'archived')::int AS "archivedTasks"
      FROM projects p
      LEFT JOIN tasks t ON t.project_id = p.id
      WHERE p.user_id = :userId
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `,
    {
      replacements: { userId: req.userId },
      type: QueryTypes.SELECT,
      raw: true,
    }
  );

  const result = projects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    userId: p.userId,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    taskCounts: {
      total: Number(p.totalTasks) || 0,
      todo: Number(p.todoTasks) || 0,
      in_progress: Number(p.inProgressTasks) || 0,
      done: Number(p.doneTasks) || 0,
      archived: Number(p.archivedTasks) || 0,
    },
  }));

  res.json(result);
};

exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const project = await Project.create({
    name: req.body.name.trim(),
    description: req.body.description?.trim() || null,
    userId: req.userId,
  });
  res.status(201).json(project);
};

exports.update = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const project = await Project.findOne({ where: { id: req.params.id, userId: req.userId } });
  if (!project) {
    return res.status(404).json({ error: 'Projet non trouvé' });
  }
  await project.update({
    name: req.body.name !== undefined ? req.body.name.trim() : project.name,
    description:
      req.body.description !== undefined
        ? req.body.description?.trim() || null
        : project.description,
  });
  res.json(project);
};

exports.remove = async (req, res) => {
  const project = await Project.findOne({ where: { id: req.params.id, userId: req.userId } });
  if (!project) {
    return res.status(404).json({ error: 'Projet non trouvé' });
  }
  await project.destroy();
  return res.status(204).send();
};
