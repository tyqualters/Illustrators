// redis connection code to be used anywhere in project

// https://redis.io/docs/latest/develop/clients/nodejs/
import { createClient } from 'redis';

// TO CONNECT TO REDIS CLOUD
// Instructions are in Redis Cloud Database, "Connect using Redis Client"
// There is code to copy and paste, it is hardcoded though so I moved the
// user, password, host, and port to .env
const redis = createClient({
  username: process.env.REDIS_USER,
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  },
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
