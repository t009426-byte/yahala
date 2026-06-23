"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, UserCheck, Clock, UserX, DoorOpen } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { t } from "@/lib/translations";
import type { EventStats } from "@/types";

interface Props { eventId: string }

const STAT_CONFIG = [
  { key: "invited"   as const, labelKey: "stat_invited"   as const, icon: Users,      gold: false },
  { key: "confirmed" as const, labelKey: "stat_confirmed" as const, icon: UserCheck,  gold: true  },
  { key: "pending"   as const, labelKey: "stat_pending"   as const, icon: Clock,      gold: false },
  { key: "declined"  as const, labelKey: "stat_declined"  as const, icon: UserX,      gold: false },
  { key: "entered"   as const, labelKey: "stat_entered"   as const, icon: DoorOpen,   gold: false },
];

async function fetchStats(eventId: string): Promise<EventStats> {
  const res = await fetch(`/api/events/${eventId}/stats`);
  if (!res.ok) throw new Error("failed");
  return (await res.json()).data as EventStats;
}

function StatCard({
  label, value, icon: Icon, gold, loading,
}: {
  label: string; value: number; icon: React.ElementType; gold: boolean; loading: boolean;
}) {
  return (
    <div className={[
      "flex-1 min-w-[100px] rounded-2xl p-4 border transition-all",
      gold ? "bg-[#C5A028]/[0.08] border-[#C5A028]/20" : "bg-[#141414] border-white/[0.06]",
    ].join(" ")}>
      <div className="flex items-center justify-between mb-3">
        <Icon size={15} className={gold ? "text-[#C5A028]" : "text-white/25"} strokeWidth={1.8} />
        {loading ? (
          <div className="h-7 w-9 bg-white/5 rounded-lg animate-pulse" />
        ) : (
          <span className={["text-2xl font-bold tabular-nums leading-none", gold ? "text-[#C5A028]" : "text-white/90"].join(" ")}>
            {value.toLocaleString()}
          </span>
        )}
      </div>
      <p className="text-[11px] text-white/35 font-medium leading-tight">{label}</p>
    </div>
  );
}

export function StatsRow({ eventId }: Props) {
  const { lang } = useLanguage();
  const { data, isLoading } = useQuery({
    queryKey: ["stats", eventId],
    queryFn: () => fetchStats(eventId),
    refetchInterval: 30_000,
  });

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {STAT_CONFIG.map(({ key, labelKey, icon, gold }) => (
        <StatCard
          key={key}
          label={t(lang, labelKey)}
          value={data?.[key] ?? 0}
          icon={icon}
          gold={gold}
          loading={isLoading}
        />
      ))}
    </div>
  );
}
