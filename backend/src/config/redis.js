const { createClient } = require('redis');

const client = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
  },
  password: process.env.REDIS_PASSWORD || undefined,
});

client.on('error', (err) => console.error('Redis error:', err));

async function connectRedis() {
  if (!client.isOpen) { await client.connect(); }
  return client;
}

module.exports = { client, connectRedis };
