"use client";

import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/components/LanguageProvider";
import { t } from "@/lib/translations";
import { formatKwd } from "@/lib/format";
import type { EventStats } from "@/types";

interface Props { eventId: string }

async function fetchStats(eventId: string): Promise<EventStats> {
  const res = await fetch(`/api/events/${eventId}/stats`);
  if (!res.ok) throw new Error("failed");
  return (await res.json()).data as EventStats;
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/50 font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/25 tabular-nums">{value}/{max}</span>
          <span className="text-xs font-bold text-white/70 tabular-nums w-9 text-start">{pct}%</span>
        </div>
      </div>
      <div className="h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ease-out ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-5">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <div className="flex justify-between">
            <div className="h-3 w-20 bg-white/5 rounded animate-pulse" />
            <div className="h-3 w-12 bg-white/5 rounded animate-pulse" />
          </div>
          <div className="h-[3px] bg-white/5 rounded-full animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function RSVPProgress({ eventId }: Props) {
  const { lang } = useLanguage();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["stats", eventId],
    queryFn: () => fetchStats(eventId),
    refetchInterval: 30_000,
  });

  return (
    <div className="bg-[#141414] rounded-2xl border border-white/[0.06] p-5 space-y-5 flex flex-col">
      <h2 className="text-xs font-semibold text-white/40 tracking-widest uppercase">
        {t(lang, "rsvp_title")}
      </h2>

      {isLoading ? <Skeleton /> : isError ? (
        <p className="text-xs text-white/30 text-center py-6">{t(lang, "load_error")}</p>
      ) : (
        <div className="space-y-5">
          <Bar label={t(lang, "rsvp_bride")} value={data?.brideConfirmed ?? 0} max={data?.brideTotal ?? 1} color="bg-gradient-to-l from-rose-400 to-pink-300" />
          <Bar label={t(lang, "rsvp_groom")} value={data?.groomConfirmed ?? 0} max={data?.groomTotal ?? 1} color="bg-gradient-to-l from-sky-400 to-blue-300" />
          <Bar
            label={t(lang, "rsvp_capacity")}
            value={(data?.confirmed ?? 0) + (data?.entered ?? 0)}
            max={data?.invited ?? 1}
            color="bg-gradient-to-l from-[#C5A028] to-[#F0D060]"
          />
        </div>
      )}

      <div className="mt-auto pt-4 border-t border-white/[0.06]">
        <p className="text-[10px] uppercase tracking-widest text-white/25 font-semibold mb-3">
          {t(lang, "gifts_total_title")}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { labelKey: "gifts_total" as const, value: data?.giftTotalKwd ?? 0, gold: true },
            { labelKey: "rsvp_bride" as const,  value: data?.giftBrideKwd ?? 0, gold: false },
            { labelKey: "rsvp_groom" as const,  value: data?.giftGroomKwd ?? 0, gold: false },
          ].map(({ labelKey, value, gold }) => (
            <div
              key={labelKey}
              className={["rounded-xl px-2.5 py-3 text-center", gold ? "bg-[#C5A028]/[0.08] border border-[#C5A028]/15" : "bg-white/[0.03] border border-white/[0.05]"].join(" ")}
            >
              {isLoading ? (
                <div className="h-3.5 bg-white/5 rounded animate-pulse mb-1.5 mx-auto w-3/4" />
              ) : (
                <p className={`font-bold text-xs tabular-nums ${gold ? "text-[#C5A028]" : "text-white/60"}`}>
                  {formatKwd(value)}
                </p>
              )}
              <p className="text-[9px] text-white/25 mt-1">{t(lang, labelKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
