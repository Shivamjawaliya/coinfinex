import dotenv from "dotenv";
dotenv.config();

export const port = process.env.PORT || 5000;
export const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/login";
export const jwtSecret = process.env.JWT_SECRET || "changeme";
export const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
export const FINNHUB_KEY = process.env.FINNHUB_KEY || "";
export const googleClientId     = process.env.GOOGLE_CLIENT_ID     || "";
export const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
export const googleCallbackUrl  = process.env.GOOGLE_CALLBACK_URL  || "http://localhost:5001/api/auth/google/callback";