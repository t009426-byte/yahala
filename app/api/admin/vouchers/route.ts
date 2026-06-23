import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(role: string) { return role === "ADMIN"; }

const createSchema = z.object({
  eventId: z.string().min(1),
  code: z.string().min(3).max(20).toUpperCase(),
  label: z.string().max(100).optional(),
  discountType: z.enum(["FIXED", "PERCENTAGE", "FREE"]),
  amount: z.number().positive().optional(),
  percentage: z.number().int().min(1).max(100).optional(),
  maxUses: z.number().int().min(1).default(1),
  expiresAt: z.string().datetime().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  const isDev = process.env.NODE_ENV === "development";
  if (!session && !isDev) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session && !isAdmin(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const eventId = req.nextUrl.searchParams.get("eventId");
  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

  const vouchers = await prisma.voucher.findMany({
    where: { eventId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { gifts: true } } },
  });

  return NextResponse.json({ data: vouchers });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const isDev = process.env.NODE_ENV === "development";
  if (!session && !isDev) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session && !isAdmin(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { code, discountType, amount, percentage, expiresAt, ...rest } = parsed.data;

  if (discountType === "FIXED" && !amount) return NextResponse.json({ error: "amount required for FIXED type" }, { status: 400 });
  if (discountType === "PERCENTAGE" && !percentage) return NextResponse.json({ error: "percentage required for PERCENTAGE type" }, { status: 400 });

  const voucher = await prisma.voucher.create({
    data: {
      ...rest,
      code: code.toUpperCase(),
      discountType,
      amount: amount ? amount : null,
      percentage: percentage ?? null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });

  return NextResponse.json({ data: voucher }, { status: 201 });
}
