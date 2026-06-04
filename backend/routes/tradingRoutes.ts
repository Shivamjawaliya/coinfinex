import { Router } from "express";
import { auth } from "../middleware/auth";
import { virtualTrading, buyStock, sellStock, resetPortfolio } from "../controllers/portfolioController";

const router = Router();

router.get("/", auth, virtualTrading);
router.post("/buy", auth, buyStock);
router.post("/sell", auth, sellStock);
router.post("/reset", auth, resetPortfolio);

export default router;
