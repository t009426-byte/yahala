import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initiatePayment, executePayment } from "@/lib/myfatoorah";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const eventId = req.nextUrl.searchParams.get("eventId");
  const sideParam = req.nextUrl.searchParams.get("side") as "BRIDE" | "GROOM" | null;
  const limit = Math.min(
    Number(req.nextUrl.searchParams.get("limit") ?? "25"),
    50
  );

  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }

  const isGlobal =
    session.user.role === "ORGANIZER" ||
    session.user.role === "COUPLE";
  if (!isGlobal && session!.user.eventId !== eventId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Family roles are scoped to their side; others use the client-supplied filter
  const forcedSide: "BRIDE" | "GROOM" | null =
    session?.user.role === "BRIDE_FAMILY" ? "BRIDE" :
    session?.user.role === "GROOM_FAMILY" ? "GROOM" :
    (sideParam ?? null);

  try {
    const gifts = await prisma.gift.findMany({
      where: {
        eventId,
        status: "PAID",
        ...(forcedSide && { guest: { side: forcedSide } }),
      },
      include: {
        guest: { select: { name: true, side: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ data: gifts });
  } catch (err) {
    console.error("[gifts GET]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      guestToken: string;
      amount: number;
      message?: string;
      voucherCode?: string;
    };

    const { guestToken, amount, message, voucherCode } = body;

    if (!guestToken) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const guest = await prisma.guest.findUnique({
      where: { qrToken: guestToken },
      select: { id: true, name: true, eventId: true, phone: true, qrToken: true },
    });

    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    // ── Voucher path ──────────────────────────────────────────────────────────
    if (voucherCode) {
      const voucher = await prisma.voucher.findUnique({
        where: { code: voucherCode.toUpperCase() },
      });

      if (!voucher || voucher.eventId !== guest.eventId) {
        return NextResponse.json({ error: "كود القسيمة غير صحيح" }, { status: 400 });
      }
      if (!voucher.isActive) {
        return NextResponse.json({ error: "القسيمة غير مفعّلة" }, { status: 400 });
      }
      if (voucher.expiresAt && voucher.expiresAt < new Date()) {
        return NextResponse.json({ error: "انتهت صلاحية القسيمة" }, { status: 400 });
      }
      if (voucher.usedCount >= voucher.maxUses) {
        return NextResponse.json({ error: "تم استخدام القسيمة بالكامل" }, { status: 400 });
      }

      await prisma.$transaction([
        prisma.gift.create({
          data: {
            eventId: guest.eventId,
            guestId: guest.id,
            amount: amount ?? 0,
            currency: "KWD",
            message: message ?? null,
            status: "PAID",
            voucherId: voucher.id,
          },
        }),
        prisma.voucher.update({
          where: { id: voucher.id },
          data: { usedCount: { increment: 1 } },
        }),
      ]);

      return NextResponse.json({ success: true });
    }

    // ── MyFatoorah path ───────────────────────────────────────────────────────
    if (!amount || amount <= 0 || amount > 500) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const gift = await prisma.gift.create({
      data: {
        eventId: guest.eventId,
        guestId: guest.id,
        amount,
        currency: "KWD",
        message: message ?? null,
        status: "PENDING",
      },
    });

    const origin = req.nextUrl.origin;
    const callbackUrl = `${origin}/api/gifts/callback`;
    const errorUrl = `${origin}/api/gifts/callback?error=1&ref=${gift.id}`;

    const methods = await initiatePayment(amount);
    if (!methods.length) throw new Error("No payment methods available");
    const method =
      methods.find((m) => m.PaymentMethodCode === "kn") ??
      methods.find((m) => m.PaymentMethodCode === "vm") ??
      methods[0];

    const payment = await executePayment({
      paymentMethodId: method.PaymentMethodId,
      amount,
      customerName: guest.name,
      customerMobile: guest.phone.replace(/^\+?965/, ""),
      reference: gift.id,
      callbackUrl,
      errorUrl,
    });

    await prisma.gift.update({
      where: { id: gift.id },
      data: { paymentRef: String(payment.InvoiceId) },
    });

    return NextResponse.json({ paymentUrl: payment.PaymentURL });
  } catch (err) {
    console.error("[gifts POST]", err);
    return NextResponse.json({ error: "Payment initiation failed" }, { status: 500 });
  }
}
