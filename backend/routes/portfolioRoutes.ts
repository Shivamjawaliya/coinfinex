import { Router } from "express";
import { auth } from "../middleware/auth";
import { portfolio } from "../controllers/portfolioController";

const router = Router();

router.get("/", auth, portfolio);

export default router;
