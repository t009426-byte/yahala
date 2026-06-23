import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GiftFeed } from "@/components/dashboard/GiftFeed";
import { GuestList } from "@/components/dashboard/GuestList";
import { DashboardHero } from "@/components/dashboard/DashboardHero";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const isDev = process.env.NODE_ENV === "development";
  if (!session && !isDev) redirect("/login");

  const eventId = session?.user.eventId ?? (isDev ? "event-demo-001" : null);

  if (!eventId) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center space-y-3">
          <p className="text-4xl opacity-20">💍</p>
          <h1 className="text-lg font-bold" style={{ color: "var(--wp-muted)" }}>
            No event assigned
          </h1>
          <p className="text-xs max-w-xs leading-relaxed" style={{ color: "var(--wp-sub)" }}>
            Contact the organizer to link your account to an event.
          </p>
        </div>
      </div>
    );
  }

  let event: {
    id: string; name: string; date: Date; venue: string;
    coupleNames: string; capacity: number;
  } | null = null;

  try {
    event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, name: true, date: true, venue: true, coupleNames: true, capacity: true },
    });
  } catch {
    // DB not connected in preview
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center space-y-2">
          <p className="text-xs uppercase tracking-widest" style={{ color: "var(--wp-sub)" }}>
            Connection error
          </p>
          <h1 className="text-lg font-bold" style={{ color: "var(--wp-muted)" }}>
            Failed to load event
          </h1>
        </div>
      </div>
    );
  }

  const daysUntil = Math.ceil(
    (event.date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const eventDateAr = event.date.toLocaleDateString("ar-KW", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const eventDateEn = event.date.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div>
      <DashboardHero
        coupleNames={event.coupleNames}
        eventDateAr={eventDateAr}
        eventDateEn={eventDateEn}
        venue={event.venue}
        daysUntil={daysUntil}
        eventId={eventId}
      />

      <div className="px-4 md:px-6 pb-2 space-y-4">
        <GiftFeed eventId={eventId} compact />
        <GuestList eventId={eventId} />
      </div>
    </div>
  );
}
