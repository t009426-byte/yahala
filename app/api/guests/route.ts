import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── POST — create a new guest ────────────────────────────────────────────────

const createSchema = z.object({
  eventId: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().min(6),
  side: z.enum(["BRIDE", "GROOM"]),
  tableNumber: z.coerce.number().int().positive().optional(),
  tier: z.enum(["GENERAL", "VIP", "BACKSTAGE"]).default("GENERAL"),
  plusOneAllowed: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  const isDev = process.env.NODE_ENV === "development";
  if (!session && !isDev) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { eventId, name, phone, side, tableNumber, tier, plusOneAllowed } = parsed.data;

  // In dev, allow any eventId; in prod check ownership
  if (session && session.user.role !== "ORGANIZER" && session.user.role !== "COUPLE") {
    const sidedRole = session.user.role === "BRIDE_FAMILY" ? "BRIDE" : "GROOM";
    if (side !== sidedRole) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    const guest = await prisma.guest.create({
      data: {
        eventId,
        name: name.trim(),
        phone: phone.replace(/[\s\-\(\)]/g, ""),
        side,
        tableNumber: tableNumber ?? null,
        tier,
        plusOneAllowed,
      },
    });

    return NextResponse.json({ data: guest }, { status: 201 });
  } catch (err) {
    console.error("[guests POST]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

const querySchema = z.object({
  eventId: z.string().min(1),
  status: z.enum(["ALL", "PENDING", "CONFIRMED", "DECLINED", "ENTERED"]).default("ALL"),
  side: z.enum(["ALL", "BRIDE", "GROOM"]).default("ALL"),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  const isDev = process.env.NODE_ENV === "development";
  if (!session && !isDev) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = querySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams)
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query params" }, { status: 400 });
  }

  const { eventId, status, side, search, page, pageSize } = parsed.data;

  // Access control
  const isGlobal =
    !session ||
    session.user.role === "ORGANIZER" ||
    session.user.role === "COUPLE";
  if (!isGlobal && session!.user.eventId !== eventId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  // Family roles are silently scoped to their side
  const forcedSide =
    session?.user.role === "BRIDE_FAMILY"
      ? "BRIDE"
      : session?.user.role === "GROOM_FAMILY"
      ? "GROOM"
      : (side as "ALL" | "BRIDE" | "GROOM");

  try {
    const where = {
      eventId,
      ...(status !== "ALL" && { status }),
      ...(forcedSide !== "ALL" && { side: forcedSide }),
      ...(search && {
        name: { contains: search, mode: "insensitive" as const },
      }),
    };

    const [guests, total] = await Promise.all([
      prisma.guest.findMany({
        where,
        include: {
          invitedBy: { select: { name: true } },
          _count: { select: { gifts: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.guest.count({ where }),
    ]);

    return NextResponse.json({
      data: guests,
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    });
  } catch (err) {
    console.error("[guests GET]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
