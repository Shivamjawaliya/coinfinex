require("dotenv").config();

module.exports = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/login",
  jwtSecret: process.env.JWT_SECRET || "sjhivamjerhke",
  alphaVantage: {
    apiKey: process.env.ALPHA_VANTAGE_API_KEY || "",
    baseUrl: process.env.ALPHA_VANTAGE_BASE_URL || "www.alphavantage.co",
  },
};
