import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import passport from "passport";
import session    from "express-session";
import MongoStore  from "connect-mongo";
import { frontendUrl, jwtSecret, mongoUri } from "./config/keys";
import "./config/passport";
import ordersRouter from "./routes/orders";
import wishlistRouter from "./routes/wishlist";

import authRoutes from "./routes/authRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import stockRoutes from "./routes/stockRoutes";
import portfolioRoutes from "./routes/portfolioRoutes";
import tradingRoutes from "./routes/tradingRoutes";
import newsRoutes from "./routes/newsRoutes";
import categoryRoutes from "./routes/categoryRoutes";

const app = express();

app.use(cors({
  origin: frontendUrl,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// ── Add this before passport.initialize() ────────
app.use(session({
  secret:            jwtSecret as string,
  resave:            false,
  saveUninitialized: false,
  store:             MongoStore.create({ mongoUrl: mongoUri }),
}));

app.use(passport.initialize());

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/trading", tradingRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api", ordersRouter);
app.use("/api/wishlist", wishlistRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

export default app;
