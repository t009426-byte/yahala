import { SignJWT, jwtVerify } from "jose";
import QRCode from "qrcode";
import type { QRTokenPayload } from "@/types";

const secret = new TextEncoder().encode(
  process.env.QR_SECRET ?? "change-me-in-production"
);

// ─── Token generation ─────────────────────────────────────────────────────────

/**
 * Signs a short-lived JWT embedding guest + event identifiers.
 * The raw qrToken (CUID) is included so the gate can do a fast DB lookup
 * without decoding the full JWT every time.
 */
export async function signQRToken(
  guestId: string,
  eventId: string,
  qrToken: string,
  expiresInHours = 720 // 30 days
): Promise<string> {
  return new SignJWT({ guestId, eventId, qrToken })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${expiresInHours}h`)
    .sign(secret);
}

/**
 * Verifies and decodes a QR JWT. Returns null if invalid/expired.
 */
export async function verifyQRToken(
  token: string
): Promise<QRTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as QRTokenPayload;
  } catch {
    return null;
  }
}

// ─── QR image generation ──────────────────────────────────────────────────────

/**
 * Generates a QR code as a base64 data URL from a signed JWT.
 * Suitable for embedding directly in an <img> src or saving as PNG.
 */
export async function generateQRDataUrl(signedJwt: string): Promise<string> {
  return QRCode.toDataURL(signedJwt, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 400,
    color: {
      dark: "#993556",
      light: "#FFFFFF",
    },
  });
}

/**
 * Convenience: sign + render in one call.
 */
export async function generateGuestQR(
  guestId: string,
  eventId: string,
  qrToken: string
): Promise<{ jwt: string; dataUrl: string }> {
  const jwt = await signQRToken(guestId, eventId, qrToken);
  const dataUrl = await generateQRDataUrl(jwt);
  return { jwt, dataUrl };
}
