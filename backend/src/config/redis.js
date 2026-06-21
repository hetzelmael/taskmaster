const { createClient } = require('redis');

const REDIS_URL  = process.env.REDIS_URL;
const REDIS_HOST = process.env.REDIS_HOST;

const redisEnabled = !!(REDIS_URL || REDIS_HOST);

const client = redisEnabled
  ? createClient(
      REDIS_URL
        ? { url: REDIS_URL }
        : {
            socket: {
              host: REDIS_HOST,
              port: parseInt(process.env.REDIS_PORT) || 6379,
            },
            password: process.env.REDIS_PASSWORD || undefined,
          }
    )
  : { isOpen: false };

if (redisEnabled) {
  client.on('error', (err) => console.error('Redis error:', err));
}

async function connectRedis() {
  if (!redisEnabled) { return null; }
  if (!client.isOpen) { await client.connect(); }
  return client;
}

module.exports = { client, connectRedis };
