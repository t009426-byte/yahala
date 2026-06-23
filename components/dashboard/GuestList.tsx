"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { useSide } from "@/components/SideProvider";
import { t } from "@/lib/translations";
import type { GuestStatus, GuestSide, GuestTier } from "@/types";

interface GuestRow {
  id: string; name: string; phone: string; side: GuestSide;
  tier: GuestTier; tableNumber: number | null; status: GuestStatus;
  invitedBy: { name: string } | null;
}

interface GuestsResponse { data: GuestRow[]; total: number; page: number; hasMore: boolean }
type StatusFilter = "ALL" | GuestStatus;

const STATUS_STYLE: Record<GuestStatus, { bg: string; color: string }> = {
  CONFIRMED: { bg: "rgba(46,125,91,0.1)",  color: "var(--wp-green)" },
  PENDING:   { bg: "rgba(62,96,128,0.1)",  color: "var(--wp-groom)" },
  DECLINED:  { bg: "rgba(168,87,79,0.1)",  color: "#A8574F"         },
  ENTERED:   { bg: "rgba(201,168,106,0.1)", color: "var(--wp-gold)" },
};

const TIER_LABEL: Record<GuestTier, string> = { GENERAL: "", VIP: "★ VIP", BACKSTAGE: "Backstage" };

async function fetchGuests(eventId: string, status: StatusFilter, search: string, page: number, side: GuestSide): Promise<GuestsResponse> {
  const params = new URLSearchParams({ eventId, status, side, page: String(page), pageSize: "15", ...(search && { search }) });
  const res = await fetch(`/api/guests?${params}`);
  if (!res.ok) throw new Error("failed");
  return res.json() as Promise<GuestsResponse>;
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderTop: "1px solid rgba(28,26,23,0.05)" }}>
      <div className="w-10 h-10 rounded-2xl flex-none" style={{ background: "var(--wp-surface)", animation: "pulse 2s infinite" }} />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-28 rounded" style={{ background: "var(--wp-surface)" }} />
        <div className="h-2.5 w-20 rounded" style={{ background: "var(--wp-surface)" }} />
      </div>
      <div className="h-5 w-14 rounded-full" style={{ background: "var(--wp-surface)" }} />
    </div>
  );
}

function GuestItem({ guest }: { guest: GuestRow }) {
  const { lang } = useLanguage();
  const isBride = guest.side === "BRIDE";
  const initials = guest.name.split(/\s+/).slice(0, 2).map((w) => w[0] ?? "").join("");
  const maskedPhone = guest.phone.replace(/(\d{4})\d+(\d{4})/, "$1****$2");

  const STATUS_LABEL_MAP: Record<GuestStatus, string> = {
    CONFIRMED: t(lang, "status_confirmed"),
    PENDING:   t(lang, "status_pending"),
    DECLINED:  t(lang, "status_declined"),
    ENTERED:   t(lang, "status_entered"),
  };

  const { bg: statusBg, color: statusColor } = STATUS_STYLE[guest.status];
  const avatarBg  = isBride ? "rgba(194,84,122,0.12)" : "rgba(62,96,128,0.12)";
  const avatarFg  = isBride ? "var(--wp-bride)"        : "var(--wp-groom)";

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 hover:bg-white/60 transition-colors cursor-pointer rounded-2xl"
      style={{ borderTop: "1px solid rgba(28,26,23,0.05)" }}
    >
      <div
        className="w-11 h-11 rounded-2xl flex-none flex items-center justify-center text-sm font-extrabold"
        style={{ background: avatarBg, color: avatarFg, fontFamily: "'Manrope',sans-serif" }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="font-bold text-sm truncate leading-tight" style={{ color: "var(--wp-dark)" }}>
            {guest.name}
          </p>
          {guest.tier !== "GENERAL" && (
            <span
              className="text-[9px] font-extrabold px-1.5 py-0.5 rounded"
              style={{ color: "var(--wp-gold-dk)", background: "rgba(176,141,79,0.12)", border: "1px solid rgba(176,141,79,0.25)" }}
            >
              {TIER_LABEL[guest.tier]}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs font-mono" dir="ltr" style={{ color: "var(--wp-muted)" }}>
            {maskedPhone}
          </span>
          {guest.tableNumber && (
            <span className="text-[10px]" style={{ color: "var(--wp-sub)" }}>
              {t(lang, "table")} {guest.tableNumber}
            </span>
          )}
        </div>
      </div>
      <span
        className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-none"
        style={{ background: statusBg, color: statusColor }}
      >
        {STATUS_LABEL_MAP[guest.status]}
      </span>
    </div>
  );
}

export function GuestList({ eventId }: { eventId: string }) {
  const { lang } = useLanguage();
  const { side } = useSide();
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [side]);

  const TABS = [
    { status: "ALL"       as StatusFilter, labelKey: "tab_all"       as const },
    { status: "CONFIRMED" as StatusFilter, labelKey: "tab_confirmed" as const },
    { status: "PENDING"   as StatusFilter, labelKey: "tab_pending"   as const },
    { status: "DECLINED"  as StatusFilter, labelKey: "tab_declined"  as const },
    { status: "ENTERED"   as StatusFilter, labelKey: "tab_entered"   as const },
  ];

  const { data, isLoading, isError } = useQuery({
    queryKey: ["guests", eventId, activeStatus, search, page, side],
    queryFn: () => fetchGuests(eventId, activeStatus, search, page, side),
    placeholderData: (prev) => prev,
  });

  function handleTabChange(status: StatusFilter) { setActiveStatus(status); setPage(1); }
  function handleSearch(value: string) { setSearch(value); setPage(1); }

  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{ background: "#FFFFFF", border: "1px solid var(--wp-border)" }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3" style={{ borderBottom: "1px solid rgba(28,26,23,0.06)" }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-bold uppercase tracking-[2px]" style={{ color: "var(--wp-muted)" }}>
            {t(lang, "guests_title")}
          </h2>
          {data && (
            <span
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: "var(--wp-surface)", color: "var(--wp-muted)" }}
            >
              {data.total.toLocaleString()} {t(lang, "guests_count")}
            </span>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex gap-1.5 overflow-x-auto scroll-hide mb-3">
          {TABS.map(({ status, labelKey }) => {
            const isActive = activeStatus === status;
            return (
              <button
                key={status}
                onClick={() => handleTabChange(status)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all"
                style={{
                  background: isActive ? "var(--wp-dark)" : "var(--wp-surface)",
                  color: isActive ? "#F6F1E9" : "var(--wp-muted)",
                }}
              >
                {t(lang, labelKey)}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={14}
            className="absolute top-1/2 -translate-y-1/2 end-3 pointer-events-none"
            style={{ color: "var(--wp-sub)" }}
          />
          <input
            type="search"
            placeholder={t(lang, "guests_search")}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pe-9 ps-3 py-2.5 text-sm rounded-xl transition-all outline-none"
            style={{
              background: "var(--wp-bg)",
              border: "1px solid rgba(28,26,23,0.1)",
              color: "var(--wp-dark)",
              fontFamily: lang === "ar" ? "'Tajawal',sans-serif" : "'Manrope',sans-serif",
            }}
          />
        </div>
      </div>

      {/* Guest rows */}
      <div className="max-h-[480px] overflow-y-auto scroll-hide px-1">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
        ) : isError ? (
          <div className="py-10 text-center text-xs" style={{ color: "var(--wp-sub)" }}>
            {t(lang, "guests_error")}
          </div>
        ) : !data?.data.length ? (
          <div className="py-14 text-center space-y-2">
            <p className="text-3xl opacity-20">👥</p>
            <p className="text-xs" style={{ color: "var(--wp-sub)" }}>
              {search ? t(lang, "guests_no_results") : t(lang, "guests_empty")}
            </p>
          </div>
        ) : (
          data.data.map((guest) => <GuestItem key={guest.id} guest={guest} />)
        )}
      </div>

      {/* Pagination */}
      {data && (data.hasMore || page > 1) && (
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ borderTop: "1px solid rgba(28,26,23,0.06)" }}
        >
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-xs font-bold transition-colors disabled:opacity-30"
            style={{ color: "var(--wp-dark)" }}
          >
            {t(lang, "guests_prev")}
          </button>
          <span className="text-xs tabular-nums" style={{ color: "var(--wp-sub)" }}>
            {t(lang, "guests_page")} {page}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!data.hasMore}
            className="text-xs font-bold transition-colors disabled:opacity-30"
            style={{ color: "var(--wp-dark)" }}
          >
            {t(lang, "guests_next")}
          </button>
        </div>
      )}
    </div>
  );
}
