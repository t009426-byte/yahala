import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateGuestQR } from "@/lib/qr";
import { sendPass } from "@/lib/whatsapp";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    token?: string;
    plusOneConfirmed?: boolean;
    plusOneName?: string;
  };

  const { token, plusOneConfirmed, plusOneName } = body;

  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const guest = await prisma.guest.findUnique({
    where: { qrToken: token },
    include: {
      event: { select: { id: true, coupleNames: true, venue: true } },
    },
  });

  if (!guest) {
    return NextResponse.json({ error: "Guest not found" }, { status: 404 });
  }

  // Idempotent — already confirmed
  if (guest.status === "CONFIRMED" || guest.status === "ENTERED") {
    return NextResponse.json({ success: true, passUrl: `/pass/${token}` });
  }

  await prisma.guest.update({
    where: { id: guest.id },
    data: {
      status: "CONFIRMED",
      ...(typeof plusOneConfirmed === "boolean" && { plusOneConfirmed }),
      ...(plusOneName && { plusOneName }),
    },
  });

  // Send WhatsApp pass (non-blocking — skip if WhatsApp not configured)
  if (process.env.WHATSAPP_API_TOKEN) {
    try {
      await generateGuestQR(guest.id, guest.event.id, guest.qrToken);
      const passUrl = `${process.env.NEXTAUTH_URL}/pass/${token}`;
      await sendPass(guest.phone, {
        name: guest.name,
        table: guest.tableNumber ? String(guest.tableNumber) : "—",
        side: guest.side === "BRIDE" ? "أهل العروس" : "أهل العريس",
        qr_image_url: passUrl,
      });
    } catch (err) {
      console.error("WhatsApp pass send failed:", err);
    }
  }

  return NextResponse.json({ success: true, passUrl: `/pass/${token}` });
}
