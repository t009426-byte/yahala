import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RSVPFlow } from "@/components/invite/RSVPFlow";

interface PageProps {
  params: { token: string };
  searchParams: { action?: string };
}

export default async function RSVPPage({ params, searchParams }: PageProps) {
  const { token } = params;
  const action = searchParams.action === "decline" ? "decline" : "attend";

  const guest = await prisma.guest.findUnique({
    where: { qrToken: token },
    select: {
      name: true,
      plusOneAllowed: true,
      status: true,
      event: { select: { coupleNames: true } },
    },
  });

  if (!guest) notFound();

  // Already has a pass — send them straight to it
  if (guest.status === "CONFIRMED" || guest.status === "ENTERED") {
    redirect(`/pass/${token}`);
  }

  return (
    <RSVPFlow
      token={token}
      action={action}
      guestName={guest.name}
      coupleNames={guest.event.coupleNames}
      plusOneAllowed={guest.plusOneAllowed}
    />
  );
}
