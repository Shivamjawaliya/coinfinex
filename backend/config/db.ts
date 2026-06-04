import mongoose from "mongoose";
import { mongoUri } from "./keys";

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", (err as Error).message);
    process.exit(1);
  }
}
