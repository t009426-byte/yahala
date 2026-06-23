import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Plus, Users, Gift, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const session = await auth();
  const isDev = process.env.NODE_ENV === "development";
  if (!session && !isDev) redirect("/login");

  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { guests: true, gifts: true, users: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Events</h1>
          <p className="text-sm text-white/40 mt-0.5">{events.length} event{events.length !== 1 ? "s" : ""} total</p>
        </div>
        <Link
          href="/admin/events/new"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-[#C5A028] text-black hover:bg-[#D4B030] transition-colors"
        >
          <Plus size={14} />
          New Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-16 text-center">
          <p className="text-4xl mb-3 opacity-20">💍</p>
          <p className="text-white/40 text-sm">No events yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const dateStr = new Date(event.date).toLocaleDateString("en-US", {
              weekday: "short", year: "numeric", month: "short", day: "numeric",
            });
            const codesReady = !!(event.brideCode && event.groomCode);
            return (
              <Link
                key={event.id}
                href={`/admin/events/${event.id}`}
                className="block rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-bold text-white/90 group-hover:text-white transition-colors truncate">
                        {event.coupleNames}
                      </h2>
                      {!codesReady && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
                          No codes
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/40 mt-0.5 truncate">{event.name}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-white/30">
                      <Calendar size={11} />
                      {dateStr} · {event.venue}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-none">
                    <div className="text-center">
                      <p className="text-lg font-bold text-white/80">{event._count.users}</p>
                      <p className="text-[10px] text-white/30 flex items-center gap-0.5"><Users size={9} /> users</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-white/80">{event._count.guests}</p>
                      <p className="text-[10px] text-white/30">guests</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-white/80">{event._count.gifts}</p>
                      <p className="text-[10px] text-white/30 flex items-center gap-0.5"><Gift size={9} /> gifts</p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
