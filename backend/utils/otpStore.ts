interface OtpEntry {
  otp: string;
  expiresAt: number;
  verified: boolean;
}

const store = new Map<string, OtpEntry>();

export function setOtp(email: string, otp: string): void {
  store.set(email, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000,
    verified: false,
  });
}

export function getOtp(email: string): OtpEntry | undefined {
  return store.get(email);
}

export function markVerified(email: string): void {
  const entry = store.get(email);
  if (entry) store.set(email, { ...entry, verified: true });
}

export function isVerified(email: string): boolean {
  const entry = store.get(email);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) { store.delete(email); return false; }
  return entry.verified;
}

export function clearOtp(email: string): void {
  store.delete(email);
}
