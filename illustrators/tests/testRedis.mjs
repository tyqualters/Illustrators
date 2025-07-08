// to test: "node tests/testRedis.mjs" in terminal (LOCAL, this is outdated and doesnt work anymore)
// .mjs instead of .js bec of ES Module errors
// to test with cloud: download "npm install dotenv-cli --save-dev"
// run test: npx dotenv -e .env -- node tests/testRedis.mjs

import { createClient } from 'redis';

// Create the Redis client
const redis = createClient({
  username: process.env.REDIS_USER,
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  },
});

// Handle connection errors
redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

// Connect and test
async function testRedis() {
  try {
    await redis.connect();

    await redis.set('test-key', 'Hello from Redis!', { EX: 30 });

    const value = await redis.get('test-key');
    console.log('Redis value:', value);

    process.exit(0); // success
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1); // error
  }
}

testRedis();
