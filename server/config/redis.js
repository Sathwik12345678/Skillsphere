const { createClient } = require("redis");

const redisUrl = process.env.REDIS_URL;
const redisClient = redisUrl ? createClient({ url: redisUrl }) : null;

if (redisClient) {
  redisClient
    .connect()
    .then(() => console.log("Redis connected"))
    .catch((error) => console.error("Redis connection failed", error.message));
}

module.exports = redisClient;
