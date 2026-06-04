import { Router } from "express";
import { auth } from "../middleware/auth";
import { dashboard } from "../controllers/dashboardController";

const router = Router();

router.get("/", auth, dashboard);

export default router;
