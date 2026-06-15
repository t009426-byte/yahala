import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { generateGuestQR } from "@/lib/qr";
import { QRPass } from "@/components/invite/QRPass";
import type { GuestSide, GuestTier } from "@/types";

interface PageProps {
  params: { token: string };
}

// ─── Data + QR generation (server-side) ──────────────────────────────────────

async function getPassData(token: string) {
  const guest = await prisma.guest.findUnique({
    where: { qrToken: token },
    include: {
      event: {
        select: {
          id: true,
          name: true,
          date: true,
          venue: true,
          coupleNames: true,
        },
      },
      invitedBy: {
        select: { id: true, name: true, invitedById: true },
        include: {
          // One level of chain ancestry is enough for display
          invitedBy: { select: { id: true, name: true } },
        } as never, // Prisma doesn't support recursive includes — fetched separately
      },
    },
  });

  if (!guest) return null;
  if (guest.status !== "CONFIRMED" && guest.status !== "ENTERED") return null;

  // Build chain path: ancestor → ... → guest (organizer first)
  const chainPath = await buildChainPath(guest.id, guest.eventId);

  // Sign a JWT and render QR image on the server
  const { dataUrl } = await generateGuestQR(guest.id, guest.eventId, guest.qrToken);

  return {
    guestName: guest.name,
    guestSide: guest.side as GuestSide,
    guestTier: guest.tier as GuestTier,
    tableNumber: guest.tableNumber,
    coupleNames: guest.event.coupleNames,
    eventName: guest.event.name,
    eventDate: guest.event.date.toISOString(),
    eventVenue: guest.event.venue,
    qrDataUrl: dataUrl,
    chainPath: chainPath.map((g) => ({ name: g.name })),
  };
}

/** Walks up invitedBy chain to build an ordered list from organizer → guest. */
async function buildChainPath(
  guestId: string,
  eventId: string
): Promise<Array<{ id: string; name: string }>> {
  const chains = await prisma.inviteChain.findMany({
    where: { eventId },
    include: {
      inviter: { select: { id: true, name: true } },
      invitee: { select: { id: true, name: true } },
    },
    orderBy: { depth: "asc" },
  });

  // Walk the chain backwards from this guest
  const path: Array<{ id: string; name: string }> = [];
  let currentId: string | null = guestId;

  while (currentId) {
    const link = chains.find((c) => c.inviteeId === currentId);
    if (!link) break;
    path.unshift({ id: link.inviter.id, name: link.inviter.name });
    currentId = link.inviterId;
  }

  return path;
}

// ─── Dynamic metadata ─────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const guest = await prisma.guest.findUnique({
    where: { qrToken: params.token },
    select: {
      name: true,
      event: { select: { coupleNames: true } },
    },
  });

  if (!guest) return { title: "تذكرة الدخول | WeddingPass" };

  return {
    title: `تذكرة ${guest.name} — ${guest.event.coupleNames}`,
    description: "تذكرة الدخول الرقمية — أظهرها عند البوابة",
    // Prevent search engine indexing of personal passes
    robots: { index: false, follow: false },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PassPage({ params }: PageProps) {
  const data = await getPassData(params.token);

  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-wedding flex items-center justify-center p-4 safe-top safe-bottom">
      <QRPass {...data} />
    </div>
  );
}
