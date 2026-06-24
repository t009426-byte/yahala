import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateEventCodes } from "@/lib/codes";

function isAdmin(role: string) { return role === "ADMIN"; }

const patchSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  coupleNames: z.string().min(2).max(120).optional(),
  date: z.string().datetime().optional(),
  venue: z.string().min(2).max(200).optional(),
  capacity: z.number().int().min(1).max(10000).optional(),
  invitationText: z.string().max(2000).nullable().optional(),
  regenerateCodes: z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      users: { select: { id: true, name: true, email: true, role: true, label: true, createdAt: true } },
      vouchers: { orderBy: { createdAt: "desc" } },
      _count: { select: { guests: true, gifts: true } },
    },
  });

  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: event });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const { regenerateCodes, date, ...rest } = parsed.data;
  const codes = regenerateCodes ? generateEventCodes() : {};

  const event = await prisma.event.update({
    where: { id: params.id },
    data: {
      ...rest,
      ...(date && { date: new Date(date) }),
      ...codes,
    },
  });

  return NextResponse.json({ data: event });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.event.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
