import { Router } from "express";
import { me, login, signup, logout } from "../controllers/authController";

const router = Router();

router.get("/me", me);
router.post("/login", login);
router.post("/signup", signup);
router.get("/logout", logout);

export default router;
