import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  const isDev = process.env.NODE_ENV === "development";
  if (!session && !isDev) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { guestId?: string };
  if (!body.guestId) {
    return NextResponse.json({ error: "guestId required" }, { status: 400 });
  }

  const guest = await prisma.guest.findUnique({
    where: { id: body.guestId },
    select: {
      id: true,
      name: true,
      side: true,
      tier: true,
      tableNumber: true,
      status: true,
      plusOneConfirmed: true,
      plusOneName: true,
    },
  });

  if (!guest) {
    return NextResponse.json({ status: "not_found", error: "الضيف غير موجود" });
  }

  if (guest.status === "ENTERED") {
    return NextResponse.json({ status: "already_entered", guest });
  }
  if (guest.status === "DECLINED") {
    return NextResponse.json({ status: "declined", error: "اعتذر عن الحضور", guest });
  }
  if (guest.status === "PENDING") {
    return NextResponse.json({ status: "pending", error: "لم يتم تأكيد الحضور بعد", guest });
  }

  const updated = await prisma.guest.update({
    where: { id: guest.id },
    data: { status: "ENTERED", enteredAt: new Date() },
    select: {
      id: true,
      name: true,
      side: true,
      tier: true,
      tableNumber: true,
      status: true,
      plusOneConfirmed: true,
      plusOneName: true,
    },
  });

  return NextResponse.json({ status: "entered", guest: updated });
}
