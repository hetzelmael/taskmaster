const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { connectRedis } = require('../config/redis');

const SALT_ROUNDS = process.env.SALT_ROUNDS ? parseInt(process.env.SALT_ROUNDS, 10) : 12;
const JWT_EXPIRES = '24h';
const JWT_TTL_SECONDS = 24 * 60 * 60;

exports.registerValidators = [
  body('firstName').isString().trim().notEmpty().withMessage('Prénom requis'),
  body('lastName').isString().trim().notEmpty().withMessage('Nom requis'),
  body('email')
    .trim()
    .matches(/^[^\s@]+@[^\s@]+$/)
    .withMessage('Email invalide'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Au moins 8 caractères')
    .matches(/[A-Z]/)
    .withMessage('Au moins une majuscule')
    .matches(/[a-z]/)
    .withMessage('Au moins une minuscule')
    .matches(/[0-9]/)
    .withMessage('Au moins un chiffre'),
];

exports.loginValidators = [
  body('email')
    .trim()
    .matches(/^[^\s@]+@[^\s@]+$/)
    .withMessage('Email invalide'),
  body('password').isString().notEmpty(),
];

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { firstName, lastName, email, password } = req.body;
  try {
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email déjà utilisé' });
    }
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ email, password: hashed, firstName, lastName });
    return res.status(201).json({ id: user.id, email: user.email });
  } catch (err) {
    console.error('register error', err);
    return res.status(500).json({ error: 'Erreur serveur interne' });
  }
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const token = jwt.sign({ userId: user.id, role: 'user' }, process.env.JWT_SECRET, {
      expiresIn: JWT_EXPIRES,
    });

    const redis = await connectRedis();
    if (redis) {
      await redis.set(`jwt:${token}`, String(user.id), { EX: JWT_TTL_SECONDS });
    }

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: JWT_TTL_SECONDS * 1000,
    });
    return res.json({ user: { id: user.id, email: user.email, firstName: user.firstName || '', lastName: user.lastName || '' } });
  } catch (err) {
    console.error('login error', err);
    return res.status(500).json({ error: 'Erreur serveur interne' });
  }
};

exports.logout = async (req, res) => {
  const token = req.cookies.auth_token;
  const redis = await connectRedis();
  if (redis) {
    await redis.del(`jwt:${token}`);
  }
  res.clearCookie('auth_token');
  return res.status(204).send();
};

exports.getMe = async (req, res) => {
  const user = await User.findByPk(req.userId, { attributes: ['id', 'email', 'firstName', 'lastName'] });
  if (!user) { return res.status(404).json({ error: 'Utilisateur non trouvé' }); }
  return res.json({ id: user.id, email: user.email, firstName: user.firstName || '', lastName: user.lastName || '' });
};

exports.updateMeValidators = [
  body('firstName').isString().trim().notEmpty().withMessage('Prénom requis'),
  body('lastName').isString().trim().notEmpty().withMessage('Nom requis'),
];

exports.updateMe = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { firstName, lastName } = req.body;
  try {
    const user = await User.findByPk(req.userId);
    if (!user) { return res.status(404).json({ error: 'Utilisateur non trouvé' }); }
    await user.update({ firstName: firstName.trim(), lastName: lastName.trim() });
    return res.json({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName });
  } catch (err) {
    console.error('updateMe error', err);
    return res.status(500).json({ error: 'Erreur serveur interne' });
  }
};

exports.deleteAccount = async (req, res) => {
  const user = await User.findByPk(req.userId);
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }

  await user.destroy();
  return res.status(204).send();
};
