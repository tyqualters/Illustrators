// to test: "node tests/testRedis.mjs" in terminal
// .mjs instead of .js bec of ES Module errors

import { createClient } from 'redis';

// Create the Redis client
const redis = createClient({
  url: 'redis://localhost:6379', // or use REDIS_URL here
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
