import { Router } from "express";
import type { Request, Response } from "express";
import { me, login, signup, logout, sendOtp, verifyOtp, forgotPassword, resetPassword } from "../controllers/authController";
import passport from "../config/passport";
import jwt from "jsonwebtoken";
import { jwtSecret, frontendUrl } from "../config/keys";
import type { IUser } from "../models/userModel";
import User from "../models/userModel";
import { createAuthCode, consumeAuthCode } from "../utils/authCodeStore";

const router = Router();

router.get("/me", me);
router.post("/login", login);
router.post("/signup", signup);
router.get("/logout", logout);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

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
    const code = createAuthCode(user.username as string);
    res.redirect(`${frontendUrl}/auth/callback?code=${code}`);
  }
);

router.get("/exchange", async (req: Request, res: Response): Promise<void> => {
  const { code } = req.query as { code: string };
  const email = consumeAuthCode(code);
  if (!email) { res.status(400).json({ message: "Invalid or expired code" }); return; }
  const user = await User.findOne({ username: email }).select("-password");
  if (!user) { res.status(404).json({ message: "User not found" }); return; }
  const token = jwt.sign({ email }, jwtSecret);
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
  });
  res.json({ user });
});

export default router;
