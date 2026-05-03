const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

const SALT_ROUNDS = 12;
const JWT_EXPIRES = '24h';

exports.registerValidators = [
  body('firstName').isString().trim().notEmpty().withMessage('Prénom requis'),
  body('lastName').isString().trim().notEmpty().withMessage('Nom requis'),
  body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Au moins 8 caractères')
    .matches(/[A-Z]/).withMessage('Au moins une majuscule')
    .matches(/[a-z]/).withMessage('Au moins une minuscule')
    .matches(/[0-9]/).withMessage('Au moins un chiffre'),
];

exports.loginValidators = [
  body('email').isEmail().normalizeEmail(),
  body('password').isString().notEmpty(),
];

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { firstName, lastName, email, password } = req.body;

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'Email déjà utilisé' });
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ email, password: hashed, firstName, lastName });

  return res.status(201).json({ id: user.id, email: user.email });
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: 'Identifiants invalides' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Identifiants invalides' });
  }

  const token = jwt.sign(
    { userId: user.id, role: 'user' },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
  return res.json({ token, user: { id: user.id, email: user.email } });
};

exports.deleteAccount = async (req, res) => {
  const user = await User.findByPk(req.userId);
  if (!user) { return res.status(404).json({ error: 'Utilisateur non trouvé' }); }

  await user.destroy();
  return res.status(204).send();
};
