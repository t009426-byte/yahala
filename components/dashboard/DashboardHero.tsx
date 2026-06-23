"use client";

import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/components/LanguageProvider";
import { useSide } from "@/components/SideProvider";
import { formatKwd } from "@/lib/format";
import type { EventStats } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  coupleNames: string;
  eventDateAr: string;
  eventDateEn: string;
  venue: string;
  daysUntil: number;
  eventId: string;
}

// ─── RSVP Ring ────────────────────────────────────────────────────────────────

function RsvpRing({
  attending,
  total,
  accent,
}: {
  attending: number;
  total: number;
  accent: string;
}) {
  const r = 52;
  const circ = 2 * Math.PI * r; // ≈ 326.73
  const pct = total > 0 ? attending / total : 0;
  const offset = circ * (1 - pct);

  return (
    <div className="relative flex-none" style={{ width: 126, height: 126 }}>
      <svg width="126" height="126" viewBox="0 0 126 126" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="63" cy="63" r={r} fill="none" stroke="#EFEAE0" strokeWidth="13" />
        <circle
          cx="63"
          cy="63"
          r={r}
          fill="none"
          stroke={accent}
          strokeWidth="13"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)" }}
        />
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ fontFamily: "'Cormorant Garamond', serif" }}
      >
        <span className="font-bold leading-none" style={{ fontSize: 38, color: "var(--wp-dark)" }}>
          {attending}
        </span>
        <span
          className="font-bold tracking-widest uppercase mt-0.5"
          style={{ fontSize: 9, color: "var(--wp-muted)" }}
        >
          {attending === 1 ? "حاضر" : "حاضر"}
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

async function fetchStats(eventId: string): Promise<EventStats> {
  const res = await fetch(`/api/events/${eventId}/stats`);
  if (!res.ok) throw new Error("failed");
  return (await res.json()).data as EventStats;
}

export function DashboardHero({
  coupleNames,
  eventDateAr,
  eventDateEn,
  venue,
  daysUntil,
  eventId,
}: Props) {
  const { lang } = useLanguage();
  const { side } = useSide();
  const isAr = lang === "ar";

  const { data: stats } = useQuery({
    queryKey: ["stats", eventId],
    queryFn: () => fetchStats(eventId),
    refetchInterval: 30_000,
  });

  const isBride = side === "BRIDE";
  const accent = isBride ? "var(--wp-bride)" : "var(--wp-groom)";
  const sideLabel = isAr
    ? isBride ? "جانب العروس" : "جانب العريس"
    : isBride ? "Bride's Side" : "Groom's Side";

  const attending = isBride
    ? (stats?.brideConfirmed ?? 0)
    : (stats?.groomConfirmed ?? 0);
  const total = isBride
    ? (stats?.brideTotal ?? 0)
    : (stats?.groomTotal ?? 0);

  const awaiting = isBride
    ? (stats?.brideTotal ?? 0) - (stats?.brideConfirmed ?? 0) - ((stats?.brideTotal ?? 0) - (stats?.brideConfirmed ?? 0) - 0)
    : 0;

  // Overall stats
  const allAttending = stats?.confirmed ?? 0;
  const allAwaiting  = stats?.pending   ?? 0;
  const allDeclined  = stats?.declined  ?? 0;
  const allTotal     = stats?.invited   ?? 0;

  // Ring uses side-specific data on the home screen
  const ringAttending = stats?.confirmed ?? 0;
  const ringTotal     = stats?.invited   ?? 0;

  const eventDate = isAr ? eventDateAr : eventDateEn;
  const eventLine = `${eventDate} · ${venue}`;

  const countdownLabel = daysUntil > 0
    ? isAr ? `${daysUntil} يوم متبقٍ` : `${daysUntil} days left`
    : daysUntil === 0
      ? isAr ? "اليوم 🎉" : "Today 🎉"
      : isAr ? "انتهى الحفل" : "Event ended";

  const whatsappLabel = isAr ? "إرسال الدعوات" : "Send Invitations";
  const gateLabel     = isAr ? "بوابة الدخول"  : "Gate";
  const giftLabel     = isAr ? "الهدايا الرقمية" : "Digital Gifts";
  const seatsLabel    = isAr ? "مقاعد مؤكدة"   : "Seats confirmed";
  const totalLabel    = isAr ? "المدعوون"       : "Guests";
  const totalGifts    = isAr ? "إجمالي الهدايا" : "Total Gifts";
  const activityLabel = isAr ? "آخر النشاطات"  : "Recent Activity";

  return (
    <div className="p-4 md:p-6 space-y-4 pb-24 md:pb-6">

      {/* ── Heading ─────────────────────────────────────────────────────────── */}
      <div className="animate-wp-rise">
        <p
          className="text-[11px] font-bold tracking-[2px] uppercase"
          style={{ color: accent }}
        >
          {sideLabel}
        </p>
        <h1
          className="font-display font-semibold leading-tight mt-1"
          style={{ fontSize: 40, color: "var(--wp-dark)" }}
        >
          {coupleNames}
        </h1>
        <p className="text-sm font-medium mt-2 leading-snug" style={{ color: "var(--wp-muted)" }}>
          {eventLine}
        </p>
        {/* Countdown pill */}
        <div
          className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full"
          style={{ background: "#FFFFFF", border: "1px solid var(--wp-border)" }}
        >
          <span
            className="w-2 h-2 rounded-full animate-wp-pulse"
            style={{ background: accent }}
          />
          <span className="text-xs font-bold" style={{ color: "var(--wp-dark)" }}>
            {countdownLabel}
          </span>
        </div>
      </div>

      {/* ── RSVP Card ───────────────────────────────────────────────────────── */}
      <div
        className="rounded-3xl p-5 shadow-sm animate-wp-rise"
        style={{
          background: "#FFFFFF",
          border: "1px solid var(--wp-border)",
          boxShadow: "0 12px 30px -18px rgba(28,26,23,0.22)",
          animationDelay: "0.06s",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-[15px] font-bold" style={{ color: "var(--wp-dark)" }}>
            {isAr ? "تأكيد الحضور" : "RSVP"}
          </span>
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide"
            style={{ color: "var(--wp-green)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-wp-pulse" style={{ background: "var(--wp-green)" }} />
            {isAr ? "مباشر" : "Live"}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <RsvpRing attending={ringAttending} total={ringTotal} accent={accent} />

          <div className="flex-1 flex flex-col gap-3">
            {[
              { color: "var(--wp-green)", label: isAr ? "مؤكدون"  : "Attending", value: allAttending },
              { color: "var(--wp-groom)", label: isAr ? "بانتظار" : "Awaiting",  value: allAwaiting  },
              { color: "#A8574F",         label: isAr ? "اعتذروا" : "Declined",  value: allDeclined  },
            ].map(({ color, label, value }) => (
              <div key={label} className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-sm flex-none" style={{ background: color }} />
                <span className="text-sm font-semibold flex-1" style={{ color: "#5A544B" }}>{label}</span>
                <span className="text-sm font-extrabold" style={{ color: "var(--wp-dark)" }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="flex items-center justify-between mt-4 pt-3"
          style={{ borderTop: "1px solid rgba(28,26,23,0.07)" }}
        >
          <span className="text-sm font-semibold" style={{ color: "var(--wp-muted)" }}>
            {seatsLabel}
          </span>
          <span className="text-sm font-extrabold" style={{ color: "var(--wp-dark)" }}>
            {allAttending}{" "}
            <span className="font-semibold text-xs" style={{ color: "var(--wp-muted)" }}>
              / {allTotal}
            </span>
          </span>
        </div>
      </div>

      {/* ── Mini Stats ──────────────────────────────────────────────────────── */}
      <div
        className="grid grid-cols-2 gap-3 animate-wp-rise"
        style={{ animationDelay: "0.12s" }}
      >
        <div
          className="rounded-[18px] p-4"
          style={{ background: "#FFFFFF", border: "1px solid var(--wp-border)" }}
        >
          <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--wp-muted)" }}>
            {totalLabel}
          </p>
          <p
            className="font-display font-bold leading-tight mt-1"
            style={{ fontSize: 30, color: "var(--wp-dark)" }}
          >
            {allTotal}
          </p>
        </div>
        <div className="rounded-[18px] p-4" style={{ background: "var(--wp-dark)" }}>
          <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--wp-gold)" }}>
            {totalGifts}
          </p>
          <p
            className="font-display font-bold leading-tight mt-1"
            style={{ fontSize: 30, color: "#F6F1E9" }}
          >
            {formatKwd(stats?.giftTotalKwd ?? 0)}
          </p>
        </div>
      </div>

      {/* ── Quick Actions ────────────────────────────────────────────────────── */}
      <div
        className="flex gap-2.5 animate-wp-rise"
        style={{ animationDelay: "0.18s" }}
      >
        <a
          href="/guests"
          className="flex-1 flex items-center justify-center gap-2 rounded-2xl py-3.5 font-extrabold text-sm transition-all active:opacity-90"
          style={{
            background: "#25D366",
            color: "#0B3D2C",
            boxShadow: "0 10px 22px -12px rgba(37,211,102,0.85)",
          }}
        >
          <WhatsAppIcon />
          {whatsappLabel}
        </a>
        <a
          href="/gate"
          className="flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 font-extrabold text-sm transition-all"
          style={{
            background: "#FFFFFF",
            color: "var(--wp-dark)",
            border: "1px solid rgba(28,26,23,0.12)",
          }}
        >
          <QrIcon />
          {gateLabel}
        </a>
      </div>

      {/* ── Recent Activity ──────────────────────────────────────────────────── */}
      <RecentActivity eventId={eventId} isAr={isAr} />
    </div>
  );
}

// ─── Recent Activity ──────────────────────────────────────────────────────────

interface ActivityItem {
  id: string;
  name: string;
  status: string;
  side: string;
  createdAt: string;
}

function RecentActivity({ eventId, isAr }: { eventId: string; isAr: boolean }) {
  const { data } = useQuery<ActivityItem[]>({
    queryKey: ["activity", eventId],
    queryFn: async () => {
      const res = await fetch(`/api/guests?eventId=${eventId}&page=1&pageSize=5&status=ALL`);
      if (!res.ok) return [];
      const json = await res.json() as { data: ActivityItem[] };
      return json.data ?? [];
    },
    refetchInterval: 20_000,
  });

  if (!data?.length) return null;

  const label = isAr ? "آخر النشاطات" : "Recent Activity";

  const STATUS_DOT: Record<string, string> = {
    CONFIRMED: "var(--wp-green)",
    PENDING:   "var(--wp-groom)",
    DECLINED:  "#A8574F",
    ENTERED:   "var(--wp-gold)",
  };
  const STATUS_AR: Record<string, string> = {
    CONFIRMED: "أكّد حضوره", PENDING: "قيد الانتظار",
    DECLINED: "اعتذر", ENTERED: "دخل الحفل",
  };
  const STATUS_EN: Record<string, string> = {
    CONFIRMED: "Confirmed", PENDING: "Awaiting",
    DECLINED: "Declined", ENTERED: "Checked in",
  };

  return (
    <div className="animate-wp-rise" style={{ animationDelay: "0.24s" }}>
      <p
        className="text-[11px] font-bold uppercase tracking-[1.5px] mb-2.5 mx-1"
        style={{ color: "var(--wp-muted)" }}
      >
        {label}
      </p>
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "#FFFFFF", border: "1px solid var(--wp-border)" }}
      >
        {data.map((item, i) => {
          const statusLabel = isAr ? (STATUS_AR[item.status] ?? item.status) : (STATUS_EN[item.status] ?? item.status);
          const dot = STATUS_DOT[item.status] ?? "var(--wp-muted)";
          const sideLabel = isAr
            ? (item.side === "BRIDE" ? "أهل العروس" : "أهل العريس")
            : (item.side === "BRIDE" ? "Bride's side" : "Groom's side");
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 px-4 py-3.5"
              style={{ borderTop: i === 0 ? "none" : "1px solid rgba(28,26,23,0.05)" }}
            >
              <span className="w-2 h-2 rounded-full flex-none" style={{ background: dot }} />
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-bold truncate" style={{ color: "var(--wp-dark)" }}>
                  {item.name}
                </p>
                <p className="text-xs font-medium" style={{ color: "var(--wp-muted)" }}>
                  {sideLabel}
                </p>
              </div>
              <span className="text-[11px] font-semibold flex-none" style={{ color: "var(--wp-sub)" }}>
                {statusLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#0B3D2C">
      <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.8 4.9-1.3A10 10 0 1 0 12 2Zm5.3 14c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.7-.1-.4-.1-.9-.3-1.6-.6-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8 0-1.3.7-2 .9-2.2.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.3 0 .5l-.4.5c-.2.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.4.1.6-.1l.8-1c.2-.2.4-.2.6-.1l1.8.9c.2.1.4.2.4.3.1.1.1.6 0 1.2Z" />
    </svg>
  );
}

function QrIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3M21 21v.01M21 14v.01M14 21v.01" />
    </svg>
  );
}
