const { Redis } = require('@upstash/redis');

// Initialize Redis client with Upstash credentials
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

module.exports = redis; 