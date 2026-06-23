import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EventForm } from "@/components/dashboard/EventForm";
import { Lock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EventPage() {
  const session = await auth();
  const isDev = process.env.NODE_ENV === "development";
  if (!session && !isDev) redirect("/login");

  // Only ORGANIZER can manage event settings
  const isOrganizer = !session || session.user.role === "ORGANIZER";
  if (!isOrganizer) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center space-y-3 max-w-xs">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto">
            <Lock size={20} className="text-white/20" />
          </div>
          <h1 className="text-base font-bold text-white/60">صلاحية محدودة</h1>
          <p className="text-xs text-white/30 leading-relaxed">
            إعدادات الفعالية متاحة للمنظّم فقط. تواصل مع منظّم الحفل للحصول على صلاحيات إضافية.
          </p>
        </div>
      </div>
    );
  }

  const eventId = session?.user.eventId ?? (isDev ? "dev-preview" : null);

  let event: {
    id: string; name: string; coupleNames: string; date: Date;
    venue: string; capacity: number;
  } | null = null;

  if (eventId) {
    try {
      event = await prisma.event.findUnique({
        where: { id: eventId },
        select: {
          id: true, name: true, coupleNames: true, date: true,
          venue: true, capacity: true,
        },
      });
    } catch {
      // DB not reachable
    }
  }

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6 max-w-2xl mx-auto">
      <EventForm event={event} />
    </div>
  );
}
