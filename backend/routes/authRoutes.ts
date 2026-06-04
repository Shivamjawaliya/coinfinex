import { Router } from "express";
import type { Request, Response } from "express";
import { me, login, signup, logout, sendOtp, verifyOtp } from "../controllers/authController";
import passport from "../config/passport";
import jwt from "jsonwebtoken";
import { jwtSecret, frontendUrl } from "../config/keys";
import type { IUser } from "../models/userModel";

const router = Router();

router.get("/me", me);
router.post("/login", login);
router.post("/signup", signup);
router.get("/logout", logout);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${frontendUrl}/login?error=oauth_failed`,
  }),
  (req: Request, res: Response) => {
    const user = req.user as IUser;
    const token = jwt.sign({ email: user.username }, jwtSecret);
    res.cookie("token", token, { httpOnly: true, sameSite: "lax" });
    res.redirect(`${frontendUrl}/explore`);
  }
);

export default router;
