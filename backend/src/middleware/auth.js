const jwt = require('jsonwebtoken');
const { connectRedis } = require('../config/redis');

module.exports = async function authMiddleware(req, res, next) {
  const token = req.cookies?.auth_token;
  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    try {
      const redis = await connectRedis();
      const stored = await redis.get(`jwt:${token}`);
      if (!stored) {
        return res.status(401).json({ error: 'Session expirée ou révoquée' });
      }
    } catch (_redisErr) {
      // Redis indisponible — dégradation gracieuse, JWT seul fait foi
    }
    req.userId = payload.userId;
    req.userRole = payload.role;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
};
