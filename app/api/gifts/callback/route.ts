import { NextRequest, NextResponse } from "next/server";
import { getPaymentStatus } from "@/lib/myfatoorah";
import { prisma } from "@/lib/prisma";

// MyFatoorah redirects the browser here after payment:
// Success: GET /api/gifts/callback?paymentId=XXX
// Error:   GET /api/gifts/callback?error=1&ref=GIFT_ID
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const paymentId = searchParams.get("paymentId");
  const isError = searchParams.get("error");
  const refId = searchParams.get("ref");

  // Hard failure from MyFatoorah error redirect
  if (isError) {
    if (refId) {
      const gift = await prisma.gift.findUnique({
        where: { id: refId },
        include: { guest: { select: { qrToken: true } } },
      }).catch(() => null);

      await prisma.gift.update({ where: { id: refId }, data: { status: "FAILED" } }).catch(() => null);

      if (gift?.guest?.qrToken) {
        return NextResponse.redirect(
          new URL(`/gift/${gift.guest.qrToken}?failed=1`, origin)
        );
      }
    }
    return NextResponse.redirect(new URL("/gift/error", origin));
  }

  if (!paymentId) {
    return NextResponse.redirect(new URL("/gift/error", origin));
  }

  try {
    const status = await getPaymentStatus(paymentId);
    const giftId = status.CustomerReference;

    if (!giftId) {
      return NextResponse.redirect(new URL("/gift/error", origin));
    }

    const isPaid = status.InvoiceStatus === "Paid";

    const gift = await prisma.gift.update({
      where: { id: giftId },
      data: {
        status: isPaid ? "PAID" : "FAILED",
        paymentMethod: status.InvoiceTransactions?.[0]?.PaymentGateway ?? null,
      },
      include: { guest: { select: { qrToken: true } } },
    });

    const token = gift.guest.qrToken;

    if (isPaid) {
      return NextResponse.redirect(new URL(`/gift/thank-you/${token}`, origin));
    }
    return NextResponse.redirect(new URL(`/gift/${token}?failed=1`, origin));
  } catch (err) {
    console.error("[gifts/callback]", err);
    return NextResponse.redirect(new URL("/gift/error", origin));
  }
}
