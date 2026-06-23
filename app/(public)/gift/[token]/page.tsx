import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { GiftForm } from "@/components/invite/GiftForm";

interface PageProps {
  params: { token: string };
  searchParams: { failed?: string };
}

async function getGuestData(token: string) {
  const qrToken = decodeURIComponent(token);
  const guest = await prisma.guest.findUnique({
    where: { qrToken },
    select: {
      name: true,
      qrToken: true,
      event: { select: { id: true, coupleNames: true } },
    },
  });
  return guest;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const guest = await getGuestData(params.token);
  if (!guest) return { title: "WeddingPass" };
  return {
    title: `هدية زفاف — ${guest.event.coupleNames}`,
    robots: { index: false, follow: false },
  };
}

export default async function GiftPage({ params, searchParams }: PageProps) {
  const guest = await getGuestData(params.token);
  if (!guest) notFound();

  return (
    <GiftForm
      guestToken={guest.qrToken}
      guestName={guest.name}
      coupleNames={guest.event.coupleNames}
      eventId={guest.event.id}
      hasFailed={searchParams.failed === "1"}
    />
  );
}
