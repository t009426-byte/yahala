import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";

// Guest-facing: validate a voucher code for a given event
export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`voucher:${ip}`, 20, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const code = req.nextUrl.searchParams.get("code")?.toUpperCase();
  const eventId = req.nextUrl.searchParams.get("eventId");

  if (!code || !eventId) return NextResponse.json({ error: "code and eventId required" }, { status: 400 });

  const voucher = await prisma.voucher.findFirst({
    where: {
      code,
      eventId,
      isActive: true,
    },
  });

  if (!voucher) return NextResponse.json({ error: "Invalid or expired voucher" }, { status: 404 });

  if (voucher.expiresAt && voucher.expiresAt < new Date()) {
    return NextResponse.json({ error: "Voucher has expired" }, { status: 410 });
  }

  if (voucher.usedCount >= voucher.maxUses) {
    return NextResponse.json({ error: "Voucher has been fully used" }, { status: 410 });
  }

  return NextResponse.json({
    data: {
      id: voucher.id,
      code: voucher.code,
      label: voucher.label,
      discountType: voucher.discountType,
      amount: voucher.amount,
      percentage: voucher.percentage,
      maxUses: voucher.maxUses,
      usedCount: voucher.usedCount,
    },
  });
}
