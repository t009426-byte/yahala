import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { InvitationCard } from "@/components/invite/InvitationCard";
import type { InvitationData } from "@/types";

interface PageProps {
  params: { token: string };
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getInvitationData(token: string): Promise<InvitationData | null> {
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
        select: { name: true },
      },
    },
  });

  if (!guest) return null;

  // Declined guests see a polite closed page instead
  if (guest.status === "DECLINED") return null;

  return {
    guestId: guest.id,
    guestName: guest.name,
    guestSide: guest.side as InvitationData["guestSide"],
    guestTier: guest.tier as InvitationData["guestTier"],
    guestStatus: guest.status as InvitationData["guestStatus"],
    tableNumber: guest.tableNumber,
    plusOneAllowed: guest.plusOneAllowed,
    coupleNames: guest.event.coupleNames,
    eventName: guest.event.name,
    eventDate: guest.event.date.toISOString(),
    eventVenue: guest.event.venue,
    invitedByName: guest.invitedBy?.name ?? null,
  };
}

// ─── Dynamic metadata ─────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const guest = await prisma.guest.findUnique({
    where: { qrToken: params.token },
    select: {
      name: true,
      event: { select: { coupleNames: true, name: true } },
    },
  });

  if (!guest) {
    return { title: "دعوة زفاف | WeddingPass" };
  }

  return {
    title: `دعوة ${guest.name} — ${guest.event.coupleNames}`,
    description: `أنتم مدعوون لحضور حفل ${guest.event.name}`,
    openGraph: {
      title: `دعوة ${guest.name} — ${guest.event.coupleNames}`,
      description: `أنتم مدعوون لحضور حفل ${guest.event.name}`,
      type: "website",
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function InvitePage({ params }: PageProps) {
  const invitation = await getInvitationData(params.token);

  if (!invitation) {
    notFound();
  }

  return <InvitationCard invitation={invitation} token={params.token} />;
}
