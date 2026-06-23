"use client";

import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/components/LanguageProvider";
import { useSide } from "@/components/SideProvider";
import { t } from "@/lib/translations";
import { formatKwd, relativeTime } from "@/lib/format";
import type { GuestSide } from "@/types";

interface GiftItem {
  id: string;
  amount: string;
  message: string | null;
  createdAt: string;
  guest: { name: string; side: GuestSide };
}

interface Props { eventId: string; compact?: boolean }

async function fetchGifts(eventId: string, side: GuestSide): Promise<GiftItem[]> {
  const res = await fetch(`/api/gifts?eventId=${eventId}&side=${side}&limit=25`);
  if (!res.ok) throw new Error("failed");
  return (await res.json()).data as GiftItem[];
}

function GiftRow({ gift }: { gift: GiftItem }) {
  const isBride = gift.guest.side === "BRIDE";
  const initials = gift.guest.name.split(/\s+/).slice(0, 2).map((w) => w[0] ?? "").join("");

  const avatarBg  = isBride ? "rgba(194,84,122,0.15)" : "rgba(62,96,128,0.15)";
  const avatarFg  = isBride ? "var(--wp-bride)"       : "var(--wp-groom)";

  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5"
      style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div
        className="w-10 h-10 rounded-xl flex-none flex items-center justify-center text-sm font-extrabold"
        style={{ background: avatarBg, color: avatarFg, fontFamily: "'Manrope',sans-serif" }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate" style={{ color: "#F6F1E9" }}>
          {gift.guest.name}
        </p>
        {gift.message && (
          <p className="text-xs mt-0.5 line-clamp-1 italic" style={{ color: "rgba(246,241,233,0.45)" }}>
            &ldquo;{gift.message}&rdquo;
          </p>
        )}
        <p className="text-[10px] mt-0.5" style={{ color: "rgba(246,241,233,0.3)" }}>
          {relativeTime(gift.createdAt)}
        </p>
      </div>
      <p
        className="font-display font-bold text-xl flex-none"
        style={{ color: "var(--wp-green)", fontFamily: "'Cormorant Garamond',serif" }}
      >
        {formatKwd(Number(gift.amount))}
      </p>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex gap-3 items-center px-4 py-3.5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="w-10 h-10 rounded-xl flex-none" style={{ background: "rgba(255,255,255,0.07)", animation: "pulse 2s infinite" }} />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-28 rounded" style={{ background: "rgba(255,255,255,0.07)" }} />
        <div className="h-2.5 w-20 rounded" style={{ background: "rgba(255,255,255,0.05)" }} />
      </div>
    </div>
  );
}

export function GiftFeed({ eventId, compact }: Props) {
  const { lang } = useLanguage();
  const { side } = useSide();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["gifts", eventId, side],
    queryFn: () => fetchGifts(eventId, side),
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
  });

  const total = data?.reduce((s, g) => s + Number(g.amount), 0) ?? 0;

  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{
        background: "linear-gradient(155deg, #211E19, #3a3026)",
        boxShadow: "0 18px 40px -22px rgba(28,26,23,0.65)",
        position: "relative",
      }}
    >
      {/* Gold radial glow */}
      <div
        style={{
          position: "absolute",
          top: -40,
          insetInlineEnd: -30,
          width: 160,
          height: 160,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,168,106,0.35), transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 relative"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div>
          <p
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "var(--wp-gold)" }}
          >
            {t(lang, "gifts_total_title")}
          </p>
          {!isLoading && (
            <p
              className="font-display font-bold leading-none mt-1"
              style={{ fontSize: 42, color: "#F6F1E9", fontFamily: "'Cormorant Garamond',serif" }}
            >
              {formatKwd(total)}
            </p>
          )}
          {isLoading && (
            <div className="h-10 w-32 rounded mt-1" style={{ background: "rgba(255,255,255,0.07)" }} />
          )}
        </div>
        <span
          className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-1"
          style={{
            color: "var(--wp-green)",
            background: "rgba(46,125,91,0.2)",
            border: "1px solid rgba(46,125,91,0.3)",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-wp-pulse" style={{ background: "var(--wp-green)" }} />
          {t(lang, "gifts_live")}
        </span>
      </div>

      {/* List */}
      <div
        className={["overflow-y-auto scroll-hide relative", compact ? "max-h-64" : "max-h-[400px]"].join(" ")}
      >
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
        ) : isError ? (
          <div className="py-10 text-center text-xs" style={{ color: "rgba(246,241,233,0.3)" }}>
            {t(lang, "gifts_error")}
          </div>
        ) : !data?.length ? (
          <div className="py-12 text-center space-y-2">
            <p className="text-3xl opacity-30">🎁</p>
            <p className="text-xs" style={{ color: "rgba(246,241,233,0.35)" }}>{t(lang, "gifts_empty")}</p>
          </div>
        ) : (
          data.map((gift) => <GiftRow key={gift.id} gift={gift} />)
        )}
      </div>
    </div>
  );
}
