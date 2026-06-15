import crypto from "node:crypto";
import { prisma } from "./prisma";

const OTP_EXPIRY_MS = 10 * 60 * 1_000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1_000; // 60 seconds between resends

function hashOTP(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

/** Cryptographically random 6-digit code */
export function generateOTP(): string {
  const num = crypto.randomBytes(3).readUIntBE(0, 3) % 1_000_000;
  return String(num).padStart(6, "0");
}

/**
 * Returns true if it's too soon to issue another OTP for this identifier.
 * Also returns how many seconds remain on the cooldown.
 */
export async function getResendCooldown(
  identifier: string
): Promise<{ blocked: boolean; waitSeconds: number }> {
  const existing = await prisma.verificationToken.findFirst({
    where: { identifier, expires: { gt: new Date() } },
    orderBy: { expires: "desc" },
  });

  if (!existing) return { blocked: false, waitSeconds: 0 };

  // The token expires in OTP_EXPIRY_MS. If it expires MORE than
  // (OTP_EXPIRY_MS - RESEND_COOLDOWN_MS) from now, it was just issued.
  const issuedAt = existing.expires.getTime() - OTP_EXPIRY_MS;
  const cooldownEnds = issuedAt + RESEND_COOLDOWN_MS;
  const now = Date.now();

  if (now < cooldownEnds) {
    return { blocked: true, waitSeconds: Math.ceil((cooldownEnds - now) / 1_000) };
  }

  return { blocked: false, waitSeconds: 0 };
}

/** Persist a new OTP for the given identifier (phone), replacing any existing one. */
export async function storeOTP(identifier: string, otp: string): Promise<void> {
  const hashed = hashOTP(otp);
  const expires = new Date(Date.now() + OTP_EXPIRY_MS);

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: { identifier, token: hashed, expires },
  });
}

/**
 * Verifies the OTP. Deletes the token on first use (single-use).
 * Returns false if not found or expired.
 */
export async function verifyOTP(
  identifier: string,
  otp: string
): Promise<boolean> {
  const hashed = hashOTP(otp);

  const record = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier, token: hashed } },
  });

  if (!record) return false;

  // Always delete (prevent replay)
  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier, token: hashed } },
  });

  return record.expires > new Date();
}
