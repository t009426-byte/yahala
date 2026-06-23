import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(2).max(120),
  coupleNames: z.string().min(2).max(120),
  date: z.string().datetime(),
  venue: z.string().min(2).max(200),
  capacity: z.number().int().min(1).max(10000),
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
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }

  const data = parsed.data;

  const event = await prisma.event.create({
    data: {
      name: data.name,
      coupleNames: data.coupleNames,
      date: new Date(data.date),
      venue: data.venue,
      capacity: data.capacity,
    },
  });

  // Link the creating user to this event as ORGANIZER
  if (session?.user.id) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { eventId: event.id, role: "ORGANIZER" },
    });
  }

  return NextResponse.json({ data: event }, { status: 201 });
}
