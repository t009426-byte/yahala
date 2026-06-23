import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const guest = await prisma.guest.findUnique({
    where: { qrToken: params.id },
    select: { id: true, status: true },
  });

  if (!guest) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Idempotent
  if (guest.status !== "PENDING") {
    return NextResponse.json({ success: true });
  }

  await prisma.guest.update({
    where: { id: guest.id },
    data: { status: "DECLINED" },
  });

  return NextResponse.json({ success: true });
}
