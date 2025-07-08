// redis connection code to be used anywhere in project

// https://redis.io/docs/latest/develop/clients/nodejs/
import { createClient } from 'redis';

// to use different port for redis, if we want to use cloud (username and pw) change this:
const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redis.on('error', (err) => {
  console.error('Redis client error:', err);
});

let isConnected = false;

export async function connectRedis() {
  if (!isConnected) {
    await redis.connect();
    isConnected = true;
  }
}

export default redis;
