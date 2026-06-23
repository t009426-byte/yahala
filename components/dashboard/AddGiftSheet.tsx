"use client";

import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/components/LanguageProvider";
import { Search, X } from "lucide-react";

const METHODS = [
  { id: "CASH",     label: "نقدي",        labelEn: "Cash"         },
  { id: "KNET",     label: "كي نت",       labelEn: "KNet"         },
  { id: "TRANSFER", label: "تحويل بنكي",  labelEn: "Bank Transfer" },
  { id: "VISA",     label: "فيزا/ماستر",  labelEn: "Visa/Master"  },
];

interface GuestOption { id: string; name: string; side: "BRIDE" | "GROOM"; phone: string }

interface Props {
  eventId: string;
  open: boolean;
  onClose: () => void;
}

export function AddGiftSheet({ eventId, open, onClose }: Props) {
  const { lang } = useLanguage();
  const qc = useQueryClient();
  const isAr = lang === "ar";

  const [search, setSearch] = useState("");
  const [guests, setGuests] = useState<GuestOption[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<GuestOption | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CASH");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setSearch(""); setGuests([]); setSelectedGuest(null);
      setAmount(""); setMethod("CASH"); setMessage("");
      setError(null); setSuccess(false);
    }
  }, [open]);

  // Debounced guest search
  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    if (!search.trim() || selectedGuest) { setGuests([]); return; }

    searchRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/guests?eventId=${eventId}&search=${encodeURIComponent(search)}&pageSize=6&status=ALL`
        );
        const json = (await res.json()) as { data: GuestOption[] };
        setGuests(json.data ?? []);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, [search, selectedGuest, eventId]);

  async function handleSubmit() {
    if (!selectedGuest || !amount || Number(amount) <= 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/gifts/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestId: selectedGuest.id,
          eventId,
          amount: Number(amount),
          paymentMethod: method,
          message: message || undefined,
        }),
      });
      if (!res.ok) throw new Error("failed");
      setSuccess(true);
      // Invalidate gifts query so GiftFeed refreshes
      void qc.invalidateQueries({ queryKey: ["gifts", eventId] });
      setTimeout(() => onClose(), 1400);
    } catch {
      setError(isAr ? "حدث خطأ، حاول مجدداً" : "Something went wrong, try again");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = !!selectedGuest && Number(amount) > 0 && !loading;

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(28,26,23,0.45)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 inset-x-0 z-50 rounded-t-3xl overflow-hidden animate-wp-sheet"
        style={{ background: "var(--wp-bg)", maxHeight: "92dvh", display: "flex", flexDirection: "column" }}
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-none">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--wp-border)" }} />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 flex-none"
          style={{ borderBottom: "1px solid var(--wp-border)" }}
        >
          <h2
            className="text-xl font-bold"
            style={{ fontFamily: "'Cormorant Garamond',serif", color: "var(--wp-dark)" }}
          >
            {isAr ? "دفع هدية" : "Pay Gift"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: "var(--wp-surface)" }}
          >
            <X size={15} style={{ color: "var(--wp-muted)" }} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto scroll-hide px-5 py-4 space-y-5">

          {/* Guest picker */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--wp-muted)" }}>
              {isAr ? "الضيف" : "Guest"}
            </label>

            {selectedGuest ? (
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{ background: "#fff", border: "1.5px solid var(--wp-dark)" }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-extrabold flex-none"
                  style={{
                    background: selectedGuest.side === "BRIDE" ? "rgba(194,84,122,0.12)" : "rgba(62,96,128,0.12)",
                    color: selectedGuest.side === "BRIDE" ? "var(--wp-bride)" : "var(--wp-groom)",
                  }}
                >
                  {selectedGuest.name.split(/\s+/).slice(0,2).map(w => w[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: "var(--wp-dark)" }}>{selectedGuest.name}</p>
                  <p className="text-xs" style={{ color: "var(--wp-sub)" }} dir="ltr">{selectedGuest.phone}</p>
                </div>
                <button onClick={() => { setSelectedGuest(null); setSearch(""); }}>
                  <X size={14} style={{ color: "var(--wp-muted)" }} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search size={14} className="absolute top-1/2 -translate-y-1/2 end-3 pointer-events-none" style={{ color: "var(--wp-sub)" }} />
                <input
                  autoFocus
                  type="text"
                  placeholder={isAr ? "ابحث عن ضيف..." : "Search guest..."}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pe-9 ps-4 py-3 rounded-2xl text-sm outline-none"
                  style={{
                    background: "#fff",
                    border: "1px solid var(--wp-border)",
                    color: "var(--wp-dark)",
                    fontFamily: isAr ? "'Tajawal',sans-serif" : "'Manrope',sans-serif",
                  }}
                />
                {(guests.length > 0 || searching) && (
                  <div
                    className="absolute top-full mt-1 w-full rounded-2xl overflow-hidden z-10"
                    style={{ background: "#fff", boxShadow: "0 8px 24px rgba(28,26,23,0.12)", border: "1px solid var(--wp-border)" }}
                  >
                    {searching ? (
                      <div className="py-4 text-center text-xs" style={{ color: "var(--wp-sub)" }}>
                        {isAr ? "جاري البحث..." : "Searching..."}
                      </div>
                    ) : guests.map(g => (
                      <button
                        key={g.id}
                        onClick={() => { setSelectedGuest(g); setSearch(g.name); setGuests([]); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-start hover:bg-[var(--wp-surface)] transition-colors"
                        style={{ borderTop: "1px solid var(--wp-border)" }}
                      >
                        <div
                          className="w-8 h-8 rounded-xl flex-none flex items-center justify-center text-xs font-extrabold"
                          style={{
                            background: g.side === "BRIDE" ? "rgba(194,84,122,0.1)" : "rgba(62,96,128,0.1)",
                            color: g.side === "BRIDE" ? "var(--wp-bride)" : "var(--wp-groom)",
                          }}
                        >
                          {g.name.split(/\s+/).slice(0,2).map(w => w[0]).join("")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: "var(--wp-dark)" }}>{g.name}</p>
                          <p className="text-[11px]" style={{ color: "var(--wp-sub)" }} dir="ltr">{g.phone}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--wp-muted)" }}>
              {isAr ? "المبلغ (KWD)" : "Amount (KWD)"}
            </label>
            <div className="relative">
              <span className="absolute start-4 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: "var(--wp-muted)" }}>KD</span>
              <input
                type="number"
                min="0.1"
                step="0.5"
                placeholder="0.000"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full ps-12 pe-4 py-3.5 rounded-2xl text-sm outline-none tabular-nums"
                style={{
                  background: "#fff",
                  border: "1px solid var(--wp-border)",
                  color: "var(--wp-dark)",
                  fontFamily: "'Manrope',sans-serif",
                }}
              />
            </div>
          </div>

          {/* Payment method */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--wp-muted)" }}>
              {isAr ? "طريقة الدفع" : "Payment Method"}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {METHODS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className="py-2.5 px-3 rounded-2xl text-sm font-bold transition-all"
                  style={{
                    background: method === m.id ? "var(--wp-dark)" : "var(--wp-surface)",
                    color: method === m.id ? "#F6F1E9" : "var(--wp-dark)",
                  }}
                >
                  {isAr ? m.label : m.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--wp-muted)" }}>
              {isAr ? "رسالة (اختياري)" : "Message (optional)"}
            </label>
            <textarea
              rows={2}
              placeholder={isAr ? "مبروك وبالرفاه..." : "Congratulations..."}
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl text-sm resize-none outline-none"
              style={{
                background: "#fff",
                border: "1px solid var(--wp-border)",
                color: "var(--wp-dark)",
                fontFamily: isAr ? "'Tajawal',sans-serif" : "'Manrope',sans-serif",
              }}
            />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-2xl text-sm text-center" style={{ background: "rgba(168,87,79,0.08)", color: "#A8574F", border: "1px solid rgba(168,87,79,0.2)" }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-none px-5 pb-6 pt-3" style={{ borderTop: "1px solid var(--wp-border)" }}>
          {success ? (
            <div
              className="w-full py-4 rounded-2xl text-center font-bold text-base"
              style={{ background: "rgba(46,125,91,0.1)", color: "var(--wp-green)", border: "1px solid rgba(46,125,91,0.25)" }}
            >
              ✓ {isAr ? "تم دفع الهدية" : "Gift paid"}
            </div>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98] disabled:opacity-40"
              style={{ background: "var(--wp-dark)", color: "#F6F1E9", fontFamily: "'Manrope',sans-serif" }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isAr ? "جاري الحفظ..." : "Saving..."}
                </span>
              ) : (
                isAr ? "دفع الهدية" : "Pay Gift"
              )}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
