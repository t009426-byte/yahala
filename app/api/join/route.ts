import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const joinSchema = z.object({
  code: z.string().min(1).max(20),
  label: z.string().min(1).max(80).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = joinSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const { code, label } = parsed.data;
  const upperCode = code.trim().toUpperCase();

  const event = await prisma.event.findFirst({
    where: {
      OR: [
        { organizerCode: upperCode },
        { brideCode: upperCode },
        { groomCode: upperCode },
        { gateCode: upperCode },
      ],
    },
    select: { id: true, organizerCode: true, brideCode: true, groomCode: true, gateCode: true },
  });

  if (!event) return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });

  const role =
    event.organizerCode === upperCode ? "ORGANIZER" :
    event.brideCode === upperCode ? "BRIDE_FAMILY" :
    event.groomCode === upperCode ? "GROOM_FAMILY" :
    "GATE_STAFF";

  await prisma.user.update({
    where: { id: session.user.id },
    data: { eventId: event.id, role, ...(label && { label }) },
  });

  return NextResponse.json({ ok: true, role });
}
