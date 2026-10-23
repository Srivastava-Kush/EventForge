import mongoose from "mongoose";

let isConnected = false;

/**
 * Connects to MongoDB. Safe to call multiple times — subsequent calls are no-ops.
 * @param {string} uri  MongoDB connection string
 */
export async function connectDB(uri) {
  if (isConnected) return;
  if (!uri) {
    console.warn("[db] MONGODB_URI not set — running without database persistence.");
    return;
  }
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
      minPoolSize: 2,
    });
    isConnected = true;
    console.log("[db] MongoDB connected");
  } catch (err) {
    console.error("[db] Connection failed:", err.message);
    throw err;
  }
}

export { mongoose };
