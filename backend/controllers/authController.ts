import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dns from "dns";
import { Resend } from "resend";
import User from "../models/userModel";
import { jwtSecret } from "../config/keys";
import { setOtp, getOtp, markVerified, isVerified, clearOtp } from "../utils/otpStore";
import { createResetToken, consumeResetToken } from "../utils/resetStore";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isProd = process.env.NODE_ENV === "production";
const cookieOptions = {
  httpOnly: true,
  sameSite: (isProd ? "none" : "lax") as "none" | "lax",
  secure: isProd,
};

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  await getResend().emails.send({
    from: "Coinfinex <onboarding@resend.dev>",
    to,
    subject,
    html,
  });
}

function otpEmailHtml(otp: string): string {
  return `
  <div style="font-family:'DM Sans',sans-serif;background:#03040a;padding:48px 24px;text-align:center;">
    <div style="max-width:420px;margin:0 auto;background:rgba(255,255,255,0.04);border:1px solid rgba(0,245,196,0.18);border-radius:20px;padding:40px 36px;">
      <h1 style="font-size:1.6rem;font-weight:800;color:#f0f0f0;margin:0 0 6px;">Coinfinex</h1>
      <p style="color:rgba(240,240,240,0.5);font-size:0.9rem;margin:0 0 32px;">Email verification</p>
      <p style="color:rgba(240,240,240,0.7);font-size:0.95rem;margin:0 0 24px;">Your one-time verification code:</p>
      <div style="background:rgba(0,245,196,0.08);border:1px solid rgba(0,245,196,0.25);border-radius:14px;padding:20px;letter-spacing:0.3em;font-size:2.2rem;font-weight:800;color:#00f5c4;margin:0 0 28px;">
        ${otp}
      </div>
      <p style="color:rgba(240,240,240,0.4);font-size:0.82rem;margin:0;">
        This code expires in <strong style="color:rgba(240,240,240,0.6);">10 minutes</strong>.<br/>
        If you didn't request this, you can ignore this email.
      </p>
    </div>
  </div>`;
}

// GET /api/auth/me
export const me = async (req: Request, res: Response): Promise<void> => {
  const token = req.cookies?.token as string | undefined;
  if (!token) { res.status(401).json({ user: null }); return; }
  try {
    const data = jwt.verify(token, jwtSecret) as { email: string };
    const user = await User.findOne({ username: data.email }).select("-password");
    res.json({ user });
  } catch {
    res.status(401).json({ user: null });
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email: string; password: string };
  try {
    const user = await User.findOne({ username: email });
    if (!user) { res.status(404).json({ message: "User not found" }); return; }

    const valid = await bcrypt.compare(password, user.password!);
    if (!valid) { res.status(401).json({ message: "Invalid credentials" }); return; }

    const token = jwt.sign({ email }, jwtSecret);
    res.cookie("token", token, cookieOptions);
    res.json({ message: "Login successful", user: { name: user.name, username: user.username } });
  } catch (err) {
    console.error("Login failed:", err);
    res.status(500).json({ message: "Login failed" });
  }
};

// POST /api/auth/send-otp
export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email: string };

  if (!EMAIL_RE.test(email)) {
    res.status(400).json({ message: "Invalid email address" });
    return;
  }

  try {
    const mx = await dns.promises.resolveMx(email.split("@")[1]);
    if (!mx || mx.length === 0) { res.status(400).json({ message: "Invalid email address" }); return; }
  } catch {
    res.status(400).json({ message: "Invalid email address" });
    return;
  }

  const existing = await User.findOne({ username: email });
  if (existing) { res.status(409).json({ message: "Email already registered" }); return; }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  setOtp(email, otp);

  try {
    await sendEmail(email, "Your Coinfinex verification code", otpEmailHtml(otp));
    res.json({ message: "OTP sent" });
  } catch (err) {
    console.error("Email send failed:", err);
    res.status(500).json({ message: "Failed to send OTP. Check server email config." });
  }
};

// POST /api/auth/verify-otp
export const verifyOtp = (req: Request, res: Response): void => {
  const { email, otp } = req.body as { email: string; otp: string };
  const entry = getOtp(email);

  if (!entry) { res.status(400).json({ message: "OTP not found. Please request a new one." }); return; }
  if (Date.now() > entry.expiresAt) { res.status(400).json({ message: "OTP has expired. Please request a new one." }); return; }
  if (entry.otp !== otp) { res.status(400).json({ message: "Invalid OTP" }); return; }

  markVerified(email);
  res.json({ valid: true });
};

// POST /api/auth/signup
export const signup = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, confirmPassword } = req.body as {
    name: string; email: string; password: string; confirmPassword: string;
  };

  if (!isVerified(email)) {
    res.status(403).json({ message: "Email not verified. Please complete OTP verification." });
    return;
  }

  const existing = await User.findOne({ username: email });
  if (existing) { res.status(409).json({ message: "User already registered" }); return; }

  if (password !== confirmPassword) { res.status(400).json({ message: "Passwords do not match" }); return; }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const created = await User.create({ name, username: email, password: hashed });
    clearOtp(email);

    const token = jwt.sign({ email }, jwtSecret);
    res.cookie("token", token, cookieOptions);
    res.status(201).json({
      message: "Signup successful",
      user: { name: created.name, username: created.username },
    });
  } catch (err) {
    console.error("Signup failed:", err);
    res.status(500).json({ message: "Signup failed" });
  }
};

// GET /api/auth/logout
export const logout = (_req: Request, res: Response): void => {
  res.clearCookie("token", cookieOptions);
  res.json({ message: "Logged out" });
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email: string };

  const user = await User.findOne({ username: email });
  // Always respond OK to avoid email enumeration
  if (!user) {
    res.json({ message: "If that email exists, a reset link has been sent." });
    return;
  }

  const token = createResetToken(email);
  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

  const html = `
  <div style="font-family:'DM Sans',sans-serif;background:#03040a;padding:48px 24px;text-align:center;">
    <div style="max-width:420px;margin:0 auto;background:rgba(255,255,255,0.04);border:1px solid rgba(0,245,196,0.18);border-radius:20px;padding:40px 36px;">
      <h1 style="font-size:1.6rem;font-weight:800;color:#f0f0f0;margin:0 0 6px;">Coinfinex</h1>
      <p style="color:rgba(240,240,240,0.5);font-size:0.9rem;margin:0 0 28px;">Password reset</p>
      <p style="color:rgba(240,240,240,0.7);font-size:0.95rem;margin:0 0 28px;line-height:1.6;">
        We received a request to reset your password. Click the button below to set a new one.
      </p>
      <a href="${resetUrl}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#00f5c4,#7b61ff);color:#000;font-weight:700;font-size:1rem;border-radius:10px;text-decoration:none;margin-bottom:28px;">
        Reset password
      </a>
      <p style="color:rgba(240,240,240,0.4);font-size:0.82rem;margin:0;">
        This link expires in <strong style="color:rgba(240,240,240,0.6);">1 hour</strong>.<br/>
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  </div>`;

  try {
    await sendEmail(email, "Reset your Coinfinex password", html);
  } catch (err) {
    console.error("Reset email failed:", err);
  }

  res.json({ message: "If that email exists, a reset link has been sent." });
};

// POST /api/auth/reset-password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token, email, password, confirmPassword } = req.body as {
    token: string; email: string; password: string; confirmPassword: string;
  };

  if (password !== confirmPassword) {
    res.status(400).json({ message: "Passwords do not match" });
    return;
  }

  const storedEmail = consumeResetToken(token);
  if (!storedEmail || storedEmail !== email) {
    res.status(400).json({ message: "Reset link is invalid or has expired" });
    return;
  }

  const user = await User.findOne({ username: email });
  if (!user) { res.status(404).json({ message: "User not found" }); return; }

  try {
    user.password = await bcrypt.hash(password, 10);
    await user.save();
    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset password failed:", err);
    res.status(500).json({ message: "Failed to reset password" });
  }
};
