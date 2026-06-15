"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { InvitationData } from "@/types";
import { SIDE_LABELS, TIER_LABELS } from "@/types";

interface InvitationCardProps {
  invitation: InvitationData;
  token: string;
}

// ─── Decorative SVG ornaments ─────────────────────────────────────────────────

function IslamicOrnament({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 40"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M100 4 L106 16 L120 16 L110 24 L114 36 L100 28 L86 36 L90 24 L80 16 L94 16 Z"
        fill="#C9A84C"
        fillOpacity="0.8"
      />
      <line x1="0" y1="20" x2="72" y2="20" stroke="#C9A84C" strokeWidth="0.75" strokeOpacity="0.5" />
      <circle cx="76" cy="20" r="2" fill="#C9A84C" fillOpacity="0.6" />
      <line x1="128" y1="20" x2="200" y2="20" stroke="#C9A84C" strokeWidth="0.75" strokeOpacity="0.5" />
      <circle cx="124" cy="20" r="2" fill="#C9A84C" fillOpacity="0.6" />
    </svg>
  );
}

function FloralCorner({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 80"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M0 0 Q40 0 40 40 Q40 0 80 0" stroke="#C9A84C" strokeWidth="0.8" strokeOpacity="0.4" fill="none" />
      <path d="M0 0 Q0 40 40 40 Q0 40 0 80" stroke="#C9A84C" strokeWidth="0.8" strokeOpacity="0.4" fill="none" />
      <circle cx="8" cy="8" r="2.5" fill="#C9A84C" fillOpacity="0.35" />
      <circle cx="20" cy="5" r="1.5" fill="#C9A84C" fillOpacity="0.25" />
      <circle cx="5" cy="20" r="1.5" fill="#C9A84C" fillOpacity="0.25" />
    </svg>
  );
}

// ─── Side badge ───────────────────────────────────────────────────────────────

function SideBadge({ side }: { side: InvitationData["guestSide"] }) {
  const isBride = side === "BRIDE";
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border",
        isBride
          ? "bg-pink-50 text-pink-700 border-pink-200"
          : "bg-sky-50 text-sky-700 border-sky-200",
      ].join(" ")}
    >
      <span>{isBride ? "♀" : "♂"}</span>
      {SIDE_LABELS[side]}
    </span>
  );
}

function TierBadge({ tier }: { tier: InvitationData["guestTier"] }) {
  if (tier === "GENERAL") return null;
  const isVip = tier === "VIP";
  return (
    <span
      className={[
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-widest uppercase border",
        isVip
          ? "bg-amber-50 text-amber-700 border-amber-300"
          : "bg-primary-50 text-primary-700 border-primary-200",
      ].join(" ")}
    >
      {isVip ? "★ VIP" : "⬤ Backstage"}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function InvitationCard({ invitation, token }: InvitationCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"attending" | "decline" | null>(null);

  const eventDate = new Date(invitation.eventDate);
  const formattedDate = eventDate.toLocaleDateString("ar-KW", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = eventDate.toLocaleTimeString("ar-KW", {
    hour: "2-digit",
    minute: "2-digit",
  });

  async function handleAttend() {
    setLoading("attending");
    router.push(`/rsvp/${token}?action=attend`);
  }

  async function handleDecline() {
    setLoading("decline");
    try {
      await fetch(`/api/guests/${token}/decline`, { method: "POST" });
    } finally {
      router.push(`/rsvp/${token}?action=decline`);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-wedding flex items-center justify-center p-4">
      {/* Petal decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 rounded-full bg-primary-200 opacity-30 animate-petal-fall"
            style={{
              left: `${15 + i * 15}%`,
              animationDelay: `${i * 1.2}s`,
              animationDuration: `${6 + i * 0.8}s`,
            }}
          />
        ))}
      </div>

      {/* Card */}
      <div className="relative w-full max-w-sm mx-auto">
        {/* Corner ornaments */}
        <FloralCorner className="absolute -top-2 -right-2 w-16 h-16 opacity-60" />
        <FloralCorner className="absolute -top-2 -left-2 w-16 h-16 opacity-60 scale-x-[-1]" />
        <FloralCorner className="absolute -bottom-2 -right-2 w-16 h-16 opacity-60 scale-y-[-1]" />
        <FloralCorner className="absolute -bottom-2 -left-2 w-16 h-16 opacity-60 scale-x-[-1] scale-y-[-1]" />

        <div className="relative glass rounded-2xl shadow-2xl shadow-primary-200/40 overflow-hidden border border-white/60 animate-fade-in">
          {/* Gold top border */}
          <div className="h-1.5 bg-gradient-gold" />

          <div className="px-6 pt-8 pb-10 text-center space-y-6">

            {/* Bismillah */}
            <div className="space-y-1">
              <p className="text-xl text-[#C9A84C] font-bold tracking-wider leading-relaxed"
                 style={{ fontFamily: "'Amiri', serif" }}>
                بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
              </p>
              <IslamicOrnament className="w-full max-w-[200px] mx-auto h-8" />
            </div>

            {/* Couple names */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground tracking-widest uppercase">
                يسعدهم بحضوركم
              </p>
              <h1
                className="text-3xl font-bold text-primary-700 leading-tight"
                style={{ fontFamily: "'Amiri', serif" }}
              >
                {invitation.coupleNames}
              </h1>
              <p className="text-muted-foreground text-sm">
                {invitation.eventName}
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary-200 to-transparent" />
              <span className="text-primary-300 text-lg">✦</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary-200 to-transparent" />
            </div>

            {/* Guest name */}
            <div className="bg-primary-50/60 rounded-xl px-4 py-3 border border-primary-100 space-y-1">
              <p className="text-xs text-muted-foreground tracking-wide">دعوة خاصة إلى</p>
              <p className="text-xl font-bold text-foreground" style={{ fontFamily: "'Amiri', serif" }}>
                {invitation.guestName}
              </p>
              <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
                <SideBadge side={invitation.guestSide} />
                <TierBadge tier={invitation.guestTier} />
              </div>
            </div>

            {/* Event details */}
            <div className="space-y-3 text-sm text-right" dir="rtl">
              <div className="flex items-start gap-3 justify-between">
                <span className="text-muted-foreground shrink-0">📅 التاريخ</span>
                <span className="font-semibold text-foreground text-left">{formattedDate}</span>
              </div>
              <div className="flex items-start gap-3 justify-between">
                <span className="text-muted-foreground shrink-0">⏰ الوقت</span>
                <span className="font-semibold text-foreground">{formattedTime}</span>
              </div>
              <div className="flex items-start gap-3 justify-between">
                <span className="text-muted-foreground shrink-0">📍 المكان</span>
                <span className="font-semibold text-foreground text-left flex-1">{invitation.eventVenue}</span>
              </div>
              {invitation.tableNumber && (
                <div className="flex items-start gap-3 justify-between">
                  <span className="text-muted-foreground shrink-0">🪑 طاولتك</span>
                  <span className="font-bold text-primary-700 text-lg">{invitation.tableNumber}</span>
                </div>
              )}
              {invitation.invitedByName && (
                <div className="flex items-start gap-3 justify-between">
                  <span className="text-muted-foreground shrink-0">🔗 دُعيتَ من</span>
                  <span className="font-medium text-foreground">{invitation.invitedByName}</span>
                </div>
              )}
            </div>

            {/* Divider */}
            <IslamicOrnament className="w-full h-8 opacity-60" />

            {/* CTA buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleAttend}
                disabled={loading !== null}
                className={[
                  "w-full py-4 rounded-xl text-white font-bold text-lg tracking-wide",
                  "bg-primary-700 hover:bg-primary-800 active:scale-[0.98]",
                  "transition-all duration-200 shadow-lg shadow-primary-300/40",
                  "disabled:opacity-70 disabled:cursor-not-allowed",
                  "flex items-center justify-center gap-2",
                ].join(" ")}
              >
                {loading === "attending" ? (
                  <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <span>✅</span>
                    <span>نعم، سأحضر بإذن الله</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDecline}
                disabled={loading !== null}
                className={[
                  "w-full py-3.5 rounded-xl font-semibold text-base tracking-wide",
                  "bg-white/80 text-muted-foreground hover:bg-white hover:text-foreground",
                  "border border-border transition-all duration-200",
                  "disabled:opacity-70 disabled:cursor-not-allowed",
                  "flex items-center justify-center gap-2",
                ].join(" ")}
              >
                {loading === "decline" ? (
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full" />
                ) : (
                  <>
                    <span>😔</span>
                    <span>معذرةً، لن أتمكن من الحضور</span>
                  </>
                )}
              </button>
            </div>

            {/* Footer note */}
            <p className="text-xs text-muted-foreground leading-relaxed pt-2">
              عند تأكيد حضورك ستصلك رسالة على واتساب
              <br />
              تحتوي على تذكرتك الرقمية وباركود الدخول
            </p>
          </div>

          {/* Gold bottom border */}
          <div className="h-1 bg-gradient-gold opacity-60" />
        </div>

        {/* Watermark */}
        <p className="text-center text-xs text-muted-foreground/50 mt-4 tracking-widest">
          WEDDINGPASS ✦
        </p>
      </div>
    </div>
  );
}
