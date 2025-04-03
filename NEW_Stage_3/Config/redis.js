import redis from 'redis';

const redisClient = redis.createClient({
  host: 'localhost',
  port: 6379,
});
redisClient.on('error', (err) => console.log('Redis Client Error:', err));

export { redisClient };
