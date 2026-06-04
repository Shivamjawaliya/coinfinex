import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { jwtSecret } from "../config/keys";

export interface JwtPayload {
  email: string;
}

declare global {
  namespace Express {
    interface User {
      email?: string;
    }
  }
}

export const auth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const tok = req.cookies?.token as string | undefined;

  if (!tok) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const decoded = jwt.verify(tok, jwtSecret) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const authOptional = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const tok = req.cookies?.token as string | undefined;
  if (tok) {
    try {
      const decoded = jwt.verify(tok, jwtSecret) as JwtPayload;
      req.user = decoded;
    } catch {
      // invalid token — just continue without user
    }
  }
  next();
};
