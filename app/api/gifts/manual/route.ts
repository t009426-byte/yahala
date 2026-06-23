import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  const isDev = process.env.NODE_ENV === "development";
  if (!session && !isDev) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await req.json()) as {
      guestId: string;
      eventId: string;
      amount: number;
      paymentMethod: string;
      message?: string;
    };

    const { guestId, eventId, amount, paymentMethod, message } = body;

    if (!guestId || !eventId || !amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Verify guest belongs to this event
    const guest = await prisma.guest.findFirst({
      where: { id: guestId, eventId },
      select: { id: true },
    });
    if (!guest) return NextResponse.json({ error: "Guest not found" }, { status: 404 });

    const gift = await prisma.gift.create({
      data: {
        eventId,
        guestId,
        amount,
        currency: "KWD",
        message: message?.trim() || null,
        paymentMethod,
        status: "PAID",
      },
    });

    return NextResponse.json({ id: gift.id });
  } catch (err) {
    console.error("[gifts/manual POST]", err);
    return NextResponse.json({ error: "Failed to record gift" }, { status: 500 });
  }
}
