import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyQRToken } from "@/lib/qr";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { jwt?: string };
  if (!body.jwt) {
    return NextResponse.json({ error: "JWT required" }, { status: 400 });
  }

  // Verify QR signature
  const payload = await verifyQRToken(body.jwt);
  if (!payload) {
    return NextResponse.json({ status: "invalid", error: "QR غير صالح أو منتهي الصلاحية" }, { status: 400 });
  }

  const guest = await prisma.guest.findUnique({
    where: { qrToken: payload.qrToken },
    select: {
      id: true,
      eventId: true,
      name: true,
      phone: true,
      side: true,
      tier: true,
      tableNumber: true,
      status: true,
      plusOneAllowed: true,
      plusOneConfirmed: true,
      plusOneName: true,
      enteredAt: true,
    },
  });

  if (!guest) {
    return NextResponse.json({ status: "not_found", error: "الضيف غير موجود في القائمة" }, { status: 404 });
  }

  // Ensure gate staff can only scan guests from their own event
  if (session.user.eventId && guest.eventId !== session.user.eventId) {
    return NextResponse.json({ status: "invalid", error: "QR غير صالح أو منتهي الصلاحية" }, { status: 403 });
  }

  if (guest.status === "DECLINED") {
    return NextResponse.json({ status: "declined", error: "هذا الضيف اعتذر عن الحضور", guest }, { status: 200 });
  }

  if (guest.status === "PENDING") {
    return NextResponse.json({ status: "pending", error: "لم يتم تأكيد هذا الضيف بعد", guest }, { status: 200 });
  }

  if (guest.status === "ENTERED") {
    return NextResponse.json({ status: "already_entered", error: "تم تسجيل دخول هذا الضيف مسبقاً", guest }, { status: 200 });
  }

  // CONFIRMED — mark as ENTERED
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
