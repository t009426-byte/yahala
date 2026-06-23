import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  coupleNames: z.string().min(2).max(120).optional(),
  date: z.string().datetime().optional(),
  venue: z.string().min(2).max(200).optional(),
  capacity: z.number().int().min(1).max(10000).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const isDev = process.env.NODE_ENV === "development";
  if (!session && !isDev) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }

  const data = parsed.data;

  const event = await prisma.event.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.coupleNames !== undefined && { coupleNames: data.coupleNames }),
      ...(data.date !== undefined && { date: new Date(data.date) }),
      ...(data.venue !== undefined && { venue: data.venue }),
      ...(data.capacity !== undefined && { capacity: data.capacity }),
    },
  });

  return NextResponse.json({ data: event });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const isDev = process.env.NODE_ENV === "development";
  if (!session && !isDev) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: event });
}
