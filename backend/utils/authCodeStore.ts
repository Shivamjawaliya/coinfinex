import crypto from "crypto";

interface CodeEntry {
  email: string;
  expiresAt: number;
}

const store = new Map<string, CodeEntry>();

export function createAuthCode(email: string): string {
  const code = crypto.randomBytes(16).toString("hex");
  store.set(code, { email, expiresAt: Date.now() + 5 * 60 * 1000 });
  return code;
}

export function consumeAuthCode(code: string): string | null {
  const entry = store.get(code);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { store.delete(code); return null; }
  store.delete(code);
  return entry.email;
}
