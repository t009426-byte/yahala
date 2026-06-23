"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Search, ScanLine, CheckCircle, AlertTriangle, XCircle, RotateCcw } from "lucide-react";

// Lazy-load QR scanner to avoid SSR issues with camera APIs
const Scanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((m) => m.Scanner),
  { ssr: false, loading: () => <ScannerPlaceholder /> }
);

// ─── Types ────────────────────────────────────────────────────────────────────

type ScanStatus = "entered" | "already_entered" | "pending" | "declined" | "not_found" | "invalid";

interface GuestResult {
  id: string;
  name: string;
  side: "BRIDE" | "GROOM";
  tier: "GENERAL" | "VIP" | "BACKSTAGE";
  tableNumber: number | null;
  status: string;
  plusOneConfirmed?: boolean | null;
  plusOneName?: string | null;
}

interface ScanResult {
  status: ScanStatus;
  error?: string;
  guest?: GuestResult;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  ScanStatus,
  { bg: string; border: string; icon: React.ReactNode; label: string }
> = {
  entered: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: <CheckCircle className="text-emerald-600" size={28} />,
    label: "مرحباً! تم التسجيل",
  },
  already_entered: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: <AlertTriangle className="text-amber-600" size={28} />,
    label: "تم التسجيل مسبقاً",
  },
  pending: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: <AlertTriangle className="text-amber-600" size={28} />,
    label: "غير مؤكد",
  },
  declined: {
    bg: "bg-rose-50",
    border: "border-rose-200",
    icon: <XCircle className="text-rose-600" size={28} />,
    label: "اعتذر عن الحضور",
  },
  not_found: {
    bg: "bg-rose-50",
    border: "border-rose-200",
    icon: <XCircle className="text-rose-600" size={28} />,
    label: "غير موجود في القائمة",
  },
  invalid: {
    bg: "bg-rose-50",
    border: "border-rose-200",
    icon: <XCircle className="text-rose-600" size={28} />,
    label: "QR غير صالح",
  },
};

const SIDE_LABEL = { BRIDE: "أهل العروس", GROOM: "أهل العريس" };
const TIER_STYLE = {
  GENERAL: "",
  VIP: "text-amber-600 font-bold",
  BACKSTAGE: "text-primary-600 font-bold",
};

// ─── Scanner placeholder ──────────────────────────────────────────────────────

function ScannerPlaceholder() {
  return (
    <div className="w-full aspect-square bg-gray-900 rounded-2xl flex items-center justify-center">
      <div className="text-center space-y-2 text-gray-400">
        <ScanLine size={40} />
        <p className="text-sm">جاري تحميل الكاميرا...</p>
      </div>
    </div>
  );
}

// ─── Guest card ───────────────────────────────────────────────────────────────

function GuestCard({
  result,
  onReset,
}: {
  result: ScanResult;
  onReset: () => void;
}) {
  const config = STATUS_CONFIG[result.status];
  const guest = result.guest;
  const isBride = guest?.side === "BRIDE";

  return (
    <div
      className={[
        "rounded-2xl border-2 p-5 space-y-4 animate-fade-in",
        config.bg,
        config.border,
      ].join(" ")}
    >
      {/* Status header */}
      <div className="flex items-center gap-3">
        {config.icon}
        <div>
          <p className="font-bold text-foreground">{config.label}</p>
          {result.error && result.status !== "entered" && (
            <p className="text-xs text-muted-foreground mt-0.5">{result.error}</p>
          )}
        </div>
      </div>

      {/* Guest details */}
      {guest && (
        <div className="bg-white/70 rounded-xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-lg text-foreground leading-tight">{guest.name}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span
                  className={[
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    isBride ? "bg-pink-100 text-pink-700" : "bg-sky-100 text-sky-700",
                  ].join(" ")}
                >
                  {SIDE_LABEL[guest.side]}
                </span>
                {guest.tier !== "GENERAL" && (
                  <span className={["text-xs", TIER_STYLE[guest.tier]].join(" ")}>
                    {guest.tier === "VIP" ? "★ VIP" : "Backstage"}
                  </span>
                )}
              </div>
            </div>
            {guest.tableNumber && (
              <div className="text-center bg-primary-50 border border-primary-100 rounded-xl px-3 py-2 shrink-0">
                <p className="text-2xl font-extrabold text-primary-700 leading-none">
                  {guest.tableNumber}
                </p>
                <p className="text-[10px] text-primary-500 mt-0.5">طاولة</p>
              </div>
            )}
          </div>

          {/* Plus one */}
          {guest.plusOneConfirmed && (
            <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
              <span>👥</span>
              <span>
                {guest.plusOneName
                  ? `مع ${guest.plusOneName}`
                  : "يحضر مع ضيف إضافي (+1)"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Reset button */}
      <button
        onClick={onReset}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/80 border border-white text-foreground font-semibold text-sm hover:bg-white transition-colors"
      >
        <RotateCcw size={14} />
        مسح ضيف آخر
      </button>
    </div>
  );
}

// ─── Name search ──────────────────────────────────────────────────────────────

function NameSearch({
  eventId,
  onResult,
}: {
  eventId: string;
  onResult: (result: ScanResult) => void;
}) {
  const [query, setQuery] = useState("");
  const [guests, setGuests] = useState<GuestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [entering, setEntering] = useState<string | null>(null);

  async function search(value: string) {
    setQuery(value);
    if (value.length < 2) {
      setGuests([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/guests?eventId=${eventId}&search=${encodeURIComponent(value)}&pageSize=5`
      );
      const data = (await res.json()) as { data: GuestResult[] };
      setGuests(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function enterGuest(guest: GuestResult) {
    if (guest.status === "ENTERED") {
      onResult({ status: "already_entered", guest });
      return;
    }
    if (guest.status !== "CONFIRMED") {
      onResult({
        status: guest.status === "DECLINED" ? "declined" : "pending",
        guest,
      });
      return;
    }
    setEntering(guest.id);
    try {
      // For name-search entry, use a dedicated endpoint that takes guestId
      const res = await fetch(`/api/gate/enter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId: guest.id }),
      });
      const data = (await res.json()) as ScanResult;
      onResult(data);
    } catch {
      onResult({ status: "invalid", error: "حدث خطأ. حاول مجدداً." });
    } finally {
      setEntering(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          size={16}
          className="absolute top-1/2 -translate-y-1/2 end-4 text-muted-foreground pointer-events-none"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => void search(e.target.value)}
          placeholder="ابحث باسم الضيف..."
          className="w-full py-3.5 pe-11 ps-4 rounded-xl border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all"
        />
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      )}

      {guests.length > 0 && (
        <div className="space-y-2">
          {guests.map((guest) => {
            const isBride = guest.side === "BRIDE";
            const isEntering = entering === guest.id;
            return (
              <div
                key={guest.id}
                className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm"
              >
                <div
                  className={[
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                    isBride ? "bg-pink-100 text-pink-700" : "bg-sky-100 text-sky-700",
                  ].join(" ")}
                >
                  {guest.name.split(/\s+/)[0]?.[0] ?? "؟"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{guest.name}</p>
                  <p
                    className={[
                      "text-xs",
                      guest.status === "CONFIRMED" ? "text-emerald-600" :
                      guest.status === "ENTERED" ? "text-violet-600" :
                      "text-muted-foreground",
                    ].join(" ")}
                  >
                    {guest.status === "CONFIRMED" ? "مؤكد" :
                     guest.status === "ENTERED" ? "دخل" :
                     guest.status === "PENDING" ? "منتظر" : "اعتذر"}
                    {guest.tableNumber ? ` · طاولة ${guest.tableNumber}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => void enterGuest(guest)}
                  disabled={isEntering}
                  className={[
                    "shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                    guest.status === "CONFIRMED"
                      ? "bg-primary-700 text-white hover:bg-primary-800"
                      : "bg-gray-100 text-muted-foreground",
                  ].join(" ")}
                >
                  {isEntering ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                  ) : guest.status === "CONFIRMED" ? (
                    "تسجيل الدخول"
                  ) : (
                    "عرض"
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {!loading && query.length >= 2 && guests.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          لا توجد نتائج لـ &ldquo;{query}&rdquo;
        </p>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function GateApp({ eventId }: { eventId: string }) {
  const [mode, setMode] = useState<"scan" | "search">("scan");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);

  const handleScan = useCallback(
    async (result: string) => {
      if (scanning || scanResult) return;
      setScanning(true);
      try {
        const res = await fetch("/api/gate/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jwt: result }),
        });
        const data = (await res.json()) as ScanResult;
        setScanResult(data);
      } catch {
        setScanResult({ status: "invalid", error: "حدث خطأ. حاول مجدداً." });
      } finally {
        setScanning(false);
      }
    },
    [scanning, scanResult]
  );

  function reset() {
    setScanResult(null);
    setScanning(false);
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <span>🔲</span> بوابة الدخول
        </h1>
      </div>

      {/* Mode toggle */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        <button
          onClick={() => { setMode("scan"); reset(); }}
          className={[
            "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all",
            mode === "scan"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          <ScanLine size={15} />
          مسح QR
        </button>
        <button
          onClick={() => { setMode("search"); reset(); }}
          className={[
            "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all",
            mode === "search"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          <Search size={15} />
          بحث بالاسم
        </button>
      </div>

      {/* Scan result */}
      {scanResult && (
        <GuestCard result={scanResult} onReset={reset} />
      )}

      {/* Camera scanner */}
      {mode === "scan" && !scanResult && (
        <div className="space-y-3">
          <div className="rounded-2xl overflow-hidden border-2 border-gray-200 bg-gray-900">
            <Scanner
              onScan={(results) => {
                const raw = results[0]?.rawValue;
                if (raw) void handleScan(raw);
              }}
              styles={{ container: { aspectRatio: "1" } }}
              components={{}}
              allowMultiple={false}
            />
          </div>
          {scanning && (
            <p className="text-center text-sm text-muted-foreground animate-pulse">
              جاري التحقق...
            </p>
          )}
          <p className="text-center text-xs text-muted-foreground">
            وجّه الكاميرا نحو باركود الضيف
          </p>
        </div>
      )}

      {/* Name search */}
      {mode === "search" && !scanResult && (
        <NameSearch
          eventId={eventId}
          onResult={(r) => setScanResult(r)}
        />
      )}
    </div>
  );
}
