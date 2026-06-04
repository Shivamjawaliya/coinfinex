import { Request, Response } from "express";
import User from "../models/userModel";

// GET /api/dashboard
export const dashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const email = req.user!.email;
    const u = await User.findOne({ username: email }).select("-password");

    const displayName = u?.username || email;
    const initials =
      displayName
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("") || "U";

    res.json({
      user: {
        name: u?.name || displayName,
        username: displayName,
        role: "User",
        initials,
      },
    });
  } catch (err) {
    console.error("Dashboard load failed:", err);
    res.status(500).json({ message: "Failed to load dashboard" });
  }
};
