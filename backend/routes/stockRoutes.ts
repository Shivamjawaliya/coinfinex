import { Router } from "express";
import { auth } from "../middleware/auth";
import { stockDetail, stockPrice } from "../controllers/stockController";

const router = Router();

router.get("/:symbol", auth, stockDetail);
router.get("/:symbol/price", auth, stockPrice);

export default router;
