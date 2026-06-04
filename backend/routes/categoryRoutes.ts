import { Router } from "express";
import { authOptional } from "../middleware/auth";
import { categories } from "../controllers/categoryController";

const router = Router();

router.get("/", authOptional, categories);

export default router;
