import { Router } from "express";
import { auth } from "../middleware/auth";
import { news } from "../controllers/newsController";

const router = Router();

router.get("/", auth, news);

export default router;
