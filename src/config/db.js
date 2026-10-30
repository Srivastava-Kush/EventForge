import mongoose from "mongoose";

/**
 * Connects to MongoDB. Safe to call multiple times — subsequent calls are no-ops.
 * @param {string} uri  MongoDB connection string
 */
export async function connectDB(uri) {
  if (mongoose.connection.readyState === 1) return;
  if (!uri) {
    console.warn("[db] MONGODB_URI not set — running without database persistence.");
    return;
  }
  try {
    mongoose.connection.on("error", (err) => {
      console.error("[db] Connection error:", err.message);
    });
    mongoose.connection.on("disconnected", () => {
      console.warn("[db] MongoDB disconnected.");
    });

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 50,
      minPoolSize: 5,
    });
    console.log("[db] MongoDB connected");
  } catch (err) {
    console.error("[db] Connection failed:", err.message);
    throw err;
  }
}

/**
 * Disconnects cleanly from MongoDB if currently connected.
 */
export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close(false);
  }
}

export { mongoose };
