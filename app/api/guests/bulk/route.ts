import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const bulkSchema = z.object({
  eventId: z.string().min(1),
  side: z.enum(["BRIDE", "GROOM"]),
  guests: z
    .array(
      z.object({
        name: z.string().min(1),
        phone: z.string().min(6),
      })
    )
    .min(1)
    .max(500),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  const isDev = process.env.NODE_ENV === "development";
  if (!session && !isDev) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { eventId, side, guests } = parsed.data;

  // Family roles may only add to their side
  if (session?.user.role === "BRIDE_FAMILY" && side !== "BRIDE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (session?.user.role === "GROOM_FAMILY" && side !== "GROOM") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await prisma.guest.createMany({
      data: guests.map((g) => ({
        eventId,
        name: g.name.trim(),
        phone: g.phone.replace(/[\s\-\(\)]/g, ""),
        side,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({ inserted: result.count }, { status: 201 });
  } catch (err) {
    console.error("[guests/bulk POST]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
