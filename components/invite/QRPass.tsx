"use client";

import Image from "next/image";
import { useState } from "react";
import type { GuestSide, GuestTier } from "@/types";
import { SIDE_LABELS, TIER_LABELS } from "@/types";

export interface QRPassProps {
  guestName: string;
  guestSide: GuestSide;
  guestTier: GuestTier;
  tableNumber: number | null;
  coupleNames: string;
  eventName: string;
  eventDate: string; // ISO
  eventVenue: string;
  qrDataUrl: string;
  chainPath?: Array<{ name: string }>;
}

// ─── Side / Tier pills ────────────────────────────────────────────────────────

function SidePill({ side }: { side: GuestSide }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border",
        side === "BRIDE"
          ? "bg-pink-50 text-pink-700 border-pink-200"
          : "bg-sky-50 text-sky-700 border-sky-200",
      ].join(" ")}
    >
      {side === "BRIDE" ? "♀" : "♂"} {SIDE_LABELS[side]}
    </span>
  );
}

function TierPill({ tier }: { tier: GuestTier }) {
  if (tier === "GENERAL") return null;
  return (
    <span
      className={[
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider",
        tier === "VIP"
          ? "bg-amber-50 text-amber-700 border-amber-300"
          : "bg-primary-50 text-primary-700 border-primary-200",
      ].join(" ")}
    >
      {tier === "VIP" ? "★ VIP" : "⬤ Backstage"}
    </span>
  );
}

// ─── Perforation line ─────────────────────────────────────────────────────────

function Perforation() {
  return (
    <div className="relative flex items-center py-1">
      {/* Left notch */}
      <div className="absolute -left-6 w-5 h-5 rounded-full bg-gradient-wedding" />
      {/* Dashes */}
      <div className="flex-1 border-t-2 border-dashed border-primary-200" />
      {/* Right notch */}
      <div className="absolute -right-6 w-5 h-5 rounded-full bg-gradient-wedding" />
    </div>
  );
}

// ─── Detail row ───────────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{label}</p>
      <p className="text-sm font-semibold text-foreground leading-tight mt-0.5">{value}</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function QRPass({
  guestName,
  guestSide,
  guestTier,
  tableNumber,
  coupleNames,
  eventName,
  eventDate,
  eventVenue,
  qrDataUrl,
  chainPath,
}: QRPassProps) {
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const date = new Date(eventDate);
  const dateStr = date.toLocaleDateString("ar-KW", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = date.toLocaleTimeString("ar-KW", {
    hour: "2-digit",
    minute: "2-digit",
  });

  async function handleSaveShare() {
    setShareError(null);

    // Try Web Share API (mobile browsers)
    if (navigator.share) {
      try {
        const blob = await (await fetch(qrDataUrl)).blob();
        const file = new File([blob], "wedding-pass.png", { type: "image/png" });
        await navigator.share({
          title: `تذكرة ${guestName} — ${coupleNames}`,
          text: `تذكرة دخول حفل ${eventName}`,
          files: [file],
        });
        return;
      } catch {
        // User cancelled share or API error — fall through to download
      }
    }

    // Fallback: trigger download
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `weddingpass-${guestName.replace(/\s+/g, "-")}.png`;
    a.click();
  }

  return (
    <div className="w-full max-w-xs mx-auto select-none" dir="rtl">
      {/* Pass card */}
      <div
        className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary-300/30 border border-white/60"
        style={{ background: "linear-gradient(160deg, #fff 0%, #fdf2f5 100%)" }}
      >
        {/* ── Top strip ─────────────────────────────────────── */}
        <div className="bg-primary-700 px-5 py-4 text-white">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest opacity-70 font-medium">
                تذكرة الدخول الرقمية
              </p>
              <p
                className="text-lg font-bold leading-tight mt-0.5 truncate"
                style={{ fontFamily: "'Amiri', serif" }}
              >
                {coupleNames}
              </p>
              <p className="text-xs opacity-80 mt-0.5 truncate">{eventName}</p>
            </div>
            <div className="shrink-0 text-3xl opacity-90">💍</div>
          </div>
        </div>

        {/* Gold accent line */}
        <div className="h-1 bg-gradient-gold" />

        {/* ── Guest block ────────────────────────────────────── */}
        <div className="px-5 pt-4 pb-3 border-b border-primary-100 space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">المدعو</p>
          <p
            className="text-2xl font-bold text-foreground leading-snug"
            style={{ fontFamily: "'Amiri', serif" }}
          >
            {guestName}
          </p>
          <div className="flex items-center gap-2 flex-wrap pt-0.5">
            <SidePill side={guestSide} />
            <TierPill tier={guestTier} />
          </div>
        </div>

        {/* ── Event details ──────────────────────────────────── */}
        <div className="px-5 py-3 grid grid-cols-2 gap-x-4 gap-y-3 border-b border-primary-100">
          <DetailRow label="التاريخ" value={dateStr} />
          <DetailRow label="الوقت" value={timeStr} />
          <DetailRow label="المكان" value={eventVenue} />
          {tableNumber ? (
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">الطاولة</p>
              <p className="text-2xl font-extrabold text-primary-700 tabular-nums leading-tight mt-0.5">
                {tableNumber}
              </p>
            </div>
          ) : (
            <div />
          )}
        </div>

        {/* ── Perforation ────────────────────────────────────── */}
        <div className="px-6">
          <Perforation />
        </div>

        {/* ── QR code ────────────────────────────────────────── */}
        <div className="flex flex-col items-center px-5 py-5 space-y-3">
          <div className="relative p-2 bg-white rounded-xl shadow-inner border border-primary-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt={`QR code for ${guestName}`}
              width={200}
              height={200}
              className="block rounded-lg"
            />
            {/* Center logo overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-sm border border-primary-100">
                💍
              </div>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
            أظهر هذا الرمز عند البوابة
            <br />
            <span className="text-primary-600 font-medium">لا تشارك هذه التذكرة مع غيرك</span>
          </p>
        </div>

        {/* ── Chain path (if present) ─────────────────────────── */}
        {chainPath && chainPath.length > 0 && (
          <div className="px-5 pb-4">
            <div className="bg-primary-50/60 rounded-xl px-3 py-2 border border-primary-100">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                سلسلة الدعوة
              </p>
              <div className="flex items-center gap-1 flex-wrap text-xs text-foreground font-medium" dir="rtl">
                <span className="text-primary-600">منظّم الحفل</span>
                {chainPath.map((node, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <span className="text-muted-foreground">←</span>
                    <span>{node.name}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Gold bottom strip */}
        <div className="h-1.5 bg-gradient-gold opacity-70" />
      </div>

      {/* ── Save / Share button ───────────────────────────────── */}
      <div className="mt-4 space-y-2">
        <button
          onClick={handleSaveShare}
          className={[
            "w-full py-3.5 rounded-xl text-white font-bold text-sm",
            "bg-primary-700 hover:bg-primary-800 active:scale-[0.98]",
            "transition-all duration-200 shadow-lg shadow-primary-300/30",
            "flex items-center justify-center gap-2",
          ].join(" ")}
        >
          <span>📥</span>
          <span>حفظ التذكرة / مشاركتها</span>
        </button>

        {shareError && (
          <p className="text-xs text-destructive text-center">{shareError}</p>
        )}

        <p className="text-center text-xs text-muted-foreground/60">
          يمكنك أخذ لقطة شاشة أو حفظ الصورة
        </p>
      </div>

      <p className="text-center text-xs text-muted-foreground/30 mt-3 tracking-widest">
        WEDDINGPASS ✦
      </p>
    </div>
  );
}
