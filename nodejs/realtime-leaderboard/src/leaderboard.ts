import { createClient } from "redis";

// Create Redis client
const redisClient = createClient();
const subscriberClient = redisClient.duplicate(); // For Pub/Sub

// Handle connection errors
redisClient.on("error", (err) => console.error("Redis Client Error:", err));
subscriberClient.on("error", (err) => console.error("Redis Subscriber Error:", err));

// Connect to Redis
(async () => {
  await redisClient.connect();
  await subscriberClient.connect();
})();

// Key for the leaderboard in Redis
const LEADERBOARD_KEY = "game:leaderboard";

/**
 * Add or update a player's score
 * @param playerId - The unique ID of the player
 * @param score - The score to add (can be negative)
 */
export const updateScore = async (playerId: string, score: number) => {
  await redisClient.zIncrBy(LEADERBOARD_KEY, score, playerId);
};

/**
 * Get the top players in the leaderboard
 * @param count - Number of top players to retrieve
 */
export const getTopPlayers = async (count: number) => {
  return await redisClient.zRangeWithScores(LEADERBOARD_KEY, -count, -1, {
    REV: true,
  });
};

/**
 * Subscribe to leaderboard updates
 * @param callback - Function to handle leaderboard updates
 */
export const subscribeToUpdates = (callback: (message: string) => void) => {
  subscriberClient.subscribe("leaderboard:updates", (message) => {
    callback(message);
  });
};

/**
 * Publish leaderboard updates
 * @param message - The update message
 */
export const publishUpdate = async (message: string) => {
  await redisClient.publish("leaderboard:updates", message);
};
