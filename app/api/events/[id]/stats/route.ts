import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const isDev = process.env.NODE_ENV === "development";
  if (!session && !isDev) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: eventId } = params;

  const canAccess =
    !session ||
    session.user.role === "ORGANIZER" ||
    session.user.role === "COUPLE" ||
    session.user.eventId === eventId;

  if (!canAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const [guests, paidGifts, event] = await Promise.all([
      prisma.guest.findMany({
        where: { eventId },
        select: { status: true, side: true },
      }),
      prisma.gift.findMany({
        where: { eventId, status: "PAID" },
        select: { amount: true, guest: { select: { side: true } } },
      }),
      prisma.event.findUnique({
        where: { id: eventId },
        select: { capacity: true },
      }),
    ]);

    const invited = guests.length;
    const confirmed = guests.filter((g) => g.status === "CONFIRMED").length;
    const pending = guests.filter((g) => g.status === "PENDING").length;
    const declined = guests.filter((g) => g.status === "DECLINED").length;
    const entered = guests.filter((g) => g.status === "ENTERED").length;

    const brideGuests = guests.filter((g) => g.side === "BRIDE");
    const groomGuests = guests.filter((g) => g.side === "GROOM");
    const brideConfirmed = brideGuests.filter(
      (g) => g.status === "CONFIRMED" || g.status === "ENTERED"
    ).length;
    const groomConfirmed = groomGuests.filter(
      (g) => g.status === "CONFIRMED" || g.status === "ENTERED"
    ).length;

    const giftTotalKwd = paidGifts.reduce((s, g) => s + Number(g.amount), 0);
    const giftBrideKwd = paidGifts
      .filter((g) => g.guest.side === "BRIDE")
      .reduce((s, g) => s + Number(g.amount), 0);
    const giftGroomKwd = paidGifts
      .filter((g) => g.guest.side === "GROOM")
      .reduce((s, g) => s + Number(g.amount), 0);

    const capacityPercent = event?.capacity
      ? Math.round(((confirmed + entered) / event.capacity) * 100)
      : 0;

    return NextResponse.json({
      data: {
        invited,
        confirmed,
        pending,
        declined,
        entered,
        brideConfirmed,
        groomConfirmed,
        brideTotal: brideGuests.length,
        groomTotal: groomGuests.length,
        giftTotalKwd,
        giftBrideKwd,
        giftGroomKwd,
        capacityPercent,
      },
    });
  } catch (err) {
    console.error("[stats GET]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
