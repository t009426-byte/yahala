import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendInvitation } from "@/lib/whatsapp";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const isDev = process.env.NODE_ENV === "development";
  if (!session && !isDev) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const guest = await prisma.guest.findUnique({
    where: { id: params.id },
    include: {
      event: {
        select: { name: true, date: true, venue: true, coupleNames: true },
      },
    },
  });

  if (!guest) {
    return NextResponse.json({ error: "Guest not found" }, { status: 404 });
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const inviteLink = `${baseUrl}/invite/${guest.qrToken}`;

  const eventDate = guest.event.date.toLocaleDateString("ar-KW", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (process.env.WHATSAPP_API_TOKEN) {
    try {
      await sendInvitation(guest.phone, {
        name: guest.name,
        event: guest.event.coupleNames,
        date: eventDate,
        venue: guest.event.venue,
        table: guest.tableNumber ? String(guest.tableNumber) : "—",
        link: inviteLink,
      });
    } catch (err) {
      console.error("[invite POST] WhatsApp error:", err);
      return NextResponse.json({ error: "WhatsApp send failed" }, { status: 502 });
    }
  } else {
    // Dev: log the invite link
    console.log(`[DEV] Invite for ${guest.name}: ${inviteLink}`);
  }

  return NextResponse.json({ success: true, inviteLink });
}
