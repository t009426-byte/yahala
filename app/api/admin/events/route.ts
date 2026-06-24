import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateEventCodes } from "@/lib/codes";

function isAdmin(role: string) {
  return role === "ADMIN";
}

const createSchema = z.object({
  name: z.string().min(2).max(120),
  coupleNames: z.string().min(2).max(120),
  date: z.string().datetime(),
  venue: z.string().min(2).max(200),
  capacity: z.number().int().min(1).max(10000),
  invitationText: z.string().max(2000).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { guests: true, gifts: true, users: true } },
    },
  });

  return NextResponse.json({ data: events });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const codes = generateEventCodes();
  const event = await prisma.event.create({
    data: {
      ...parsed.data,
      date: new Date(parsed.data.date),
      ...codes,
    },
  });

  return NextResponse.json({ data: event }, { status: 201 });
}
