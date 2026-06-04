import crypto from "crypto";

interface ResetEntry {
  email: string;
  expiresAt: number;
}

const store = new Map<string, ResetEntry>();

export function createResetToken(email: string): string {
  const token = crypto.randomBytes(32).toString("hex");
  store.set(token, { email, expiresAt: Date.now() + 60 * 60 * 1000 }); // 1 hour
  return token;
}

export function consumeResetToken(token: string): string | null {
  const entry = store.get(token);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { store.delete(token); return null; }
  store.delete(token);
  return entry.email;
}
