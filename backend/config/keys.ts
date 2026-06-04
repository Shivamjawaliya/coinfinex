import dotenv from "dotenv";
dotenv.config();

export const port = process.env.PORT || 5000;
export const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/login";
export const jwtSecret = process.env.JWT_SECRET || "sjhivamjerhke";
export const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
