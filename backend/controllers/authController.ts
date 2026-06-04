import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/userModel";
import { jwtSecret } from "../config/keys";

// GET /api/auth/me
export const me = async (req: Request, res: Response): Promise<void> => {
  const token = req.cookies?.token as string | undefined;
  if (!token) {
    res.status(401).json({ user: null });
    return;
  }
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
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const valid = await bcrypt.compare(password, user.password!);
    if (!valid) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const token = jwt.sign({ email }, jwtSecret);
    res.cookie("token", token, { httpOnly: true, sameSite: "lax" });
    res.json({
      message: "Login successful",
      user: { name: user.name, username: user.username },
    });
  } catch (err) {
    console.error("Login failed:", err);
    res.status(500).json({ message: "Login failed" });
  }
};

// POST /api/auth/signup
export const signup = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, confirmPassword } = req.body as {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  };

  const existing = await User.findOne({ username: email });
  if (existing) {
    res.status(409).json({ message: "User already registered" });
    return;
  }

  if (password !== confirmPassword) {
    res.status(400).json({ message: "Passwords do not match" });
    return;
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const created = await User.create({ name, username: email, password: hashed });

    const token = jwt.sign({ email }, jwtSecret);
    res.cookie("token", token, { httpOnly: true, sameSite: "lax" });
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
  res.clearCookie("token");
  res.json({ message: "Logged out" });
};
