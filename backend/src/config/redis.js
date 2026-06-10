const { createClient } = require('redis');

const REDIS_HOST = process.env.REDIS_HOST;

// When REDIS_HOST is unset, export a dummy client so all `client.isOpen` guards
// short-circuit cleanly without attempting any connection.
const client = REDIS_HOST
  ? createClient({
      socket: {
        host: REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT) || 6379,
      },
      password: process.env.REDIS_PASSWORD || undefined,
    })
  : { isOpen: false };

if (REDIS_HOST) {
  client.on('error', (err) => console.error('Redis error:', err));
}

async function connectRedis() {
  if (!REDIS_HOST) { return null; }
  if (!client.isOpen) { await client.connect(); }
  return client;
}

module.exports = { client, connectRedis };
