import mongoose from "mongoose";
import { env } from "./env";

let connectionPromise: Promise<typeof mongoose> | null = null;

export async function connectDatabase(): Promise<typeof mongoose> {
  if (env.DEMO_MODE) {
    return mongoose;
  }

  if (!env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required when DEMO_MODE=false. Add it to your .env file and restart the API.");
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(env.MONGODB_URI, {
      autoIndex: env.NODE_ENV !== "production",
      serverSelectionTimeoutMS: 10_000,
    });
  }

  return connectionPromise;
}
