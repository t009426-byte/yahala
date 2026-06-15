import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateOTP, storeOTP, getResendCooldown } from "@/lib/otp";
import { sendText } from "@/lib/whatsapp";

const bodySchema = z.object({
  phone: z
    .string()
    .min(8)
    .max(15)
    .regex(/^\+?\d+$/, "Phone must contain only digits"),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid phone number" },
      { status: 400 }
    );
  }

  // Normalize: strip leading + if present
  const phone = parsed.data.phone.replace(/^\+/, "");

  // Cooldown check (prevent spam)
  const cooldown = await getResendCooldown(phone);
  if (cooldown.blocked) {
    return NextResponse.json(
      {
        error: `Please wait ${cooldown.waitSeconds}s before requesting a new code`,
        waitSeconds: cooldown.waitSeconds,
      },
      { status: 429 }
    );
  }

  const otp = generateOTP();
  await storeOTP(phone, otp);

  const message =
    `🔐 رمز التحقق الخاص بك:\n\n` +
    `*${otp}*\n\n` +
    `صالح لمدة 10 دقائق — لا تشاركه مع أحد.`;

  // In development, skip WhatsApp and log to console
  if (process.env.NODE_ENV === "development") {
    console.log(`[OTP] ${phone} → ${otp}`);
  } else {
    try {
      await sendText(phone, message);
    } catch (err) {
      console.error("[OTP] WhatsApp send failed:", err);
      return NextResponse.json(
        { error: "Failed to send OTP via WhatsApp. Please try again." },
        { status: 502 }
      );
    }
  }

  return NextResponse.json({
    success: true,
    // Only expose OTP in development (for testing without WhatsApp)
    ...(process.env.NODE_ENV === "development" && { _dev_otp: otp }),
  });
}
