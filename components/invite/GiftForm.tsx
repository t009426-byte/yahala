"use client";

import { useState } from "react";

interface VoucherInfo {
  id: string;
  code: string;
  label: string | null;
  discountType: "FIXED" | "PERCENTAGE" | "FREE";
  amount: string | null;
  percentage: number | null;
}

interface Props {
  guestToken: string;
  guestName: string;
  coupleNames: string;
  eventId: string;
  hasFailed?: boolean;
}

export function GiftForm({ guestToken, guestName, coupleNames, eventId, hasFailed }: Props) {
  const [mode, setMode] = useState<"pay" | "voucher">("pay");
  const [amountStr, setAmountStr] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(hasFailed ? "لم تكتمل عملية الدفع. يمكنك المحاولة مجدداً." : null);

  // Voucher mode state
  const [voucherCode, setVoucherCode] = useState("");
  const [voucher, setVoucher] = useState<VoucherInfo | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [voucherSuccess, setVoucherSuccess] = useState(false);

  const finalAmount = amountStr ? parseFloat(amountStr) : null;
  const canSubmit = finalAmount !== null && finalAmount > 0 && finalAmount <= 500 && !loading;

  async function handleSubmit() {
    if (!canSubmit || finalAmount === null) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestToken, amount: finalAmount, message: message.trim() || undefined }),
      });
      const json = await res.json() as { paymentUrl?: string; error?: string };
      if (!res.ok || !json.paymentUrl) throw new Error(json.error ?? "فشل في بدء الدفع");
      window.location.href = json.paymentUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ غير متوقع");
      setLoading(false);
    }
  }

  async function validateVoucher() {
    if (!voucherCode.trim()) return;
    setValidating(true);
    setVoucherError(null);
    setVoucher(null);
    try {
      const res = await fetch(`/api/vouchers?code=${encodeURIComponent(voucherCode.trim().toUpperCase())}&eventId=${eventId}`);
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        setVoucherError(d.error ?? "الكود غير صحيح");
        return;
      }
      const { data } = await res.json() as { data: VoucherInfo };
      setVoucher(data);
    } finally {
      setValidating(false);
    }
  }

  async function handleVoucherGift() {
    if (!voucher) return;
    setLoading(true);
    setVoucherError(null);
    try {
      // For FREE vouchers, amount = 0 (gift is free)
      // For FIXED/PERCENTAGE, we still record the "gift" with the discounted amount (or 0)
      const giftAmount = voucher.discountType === "FREE" ? 0
        : voucher.discountType === "FIXED" ? (Number(voucher.amount) || 0)
        : 0; // percentage is symbolic — free gift from sponsor

      const res = await fetch("/api/gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestToken,
          amount: giftAmount,
          message: message.trim() || undefined,
          voucherCode: voucher.code,
        }),
      });
      const json = await res.json() as { success?: boolean; error?: string };
      if (!res.ok) throw new Error(json.error ?? "حدث خطأ");
      setVoucherSuccess(true);
    } catch (e) {
      setVoucherError(e instanceof Error ? e.message : "حدث خطأ");
      setLoading(false);
    }
  }

  function discountLabel(v: VoucherInfo) {
    if (v.discountType === "FREE") return "مجاني 100%";
    if (v.discountType === "PERCENTAGE") return `خصم ${v.percentage}%`;
    return `خصم ${Number(v.amount).toFixed(3)} KD`;
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: "var(--wp-bg)", fontFamily: "'Manrope', sans-serif" }}
      dir="rtl"
    >
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <p className="text-[11px] font-bold tracking-[3px] uppercase" style={{ color: "var(--wp-sub)" }}>WeddingPass ✦</p>
          <h1 className="text-4xl leading-tight mt-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--wp-dark)", fontWeight: 600 }}>
            أرسل هدية
          </h1>
          <p className="text-sm" style={{ color: "var(--wp-muted)" }}>{coupleNames}</p>
        </div>

        <div className="rounded-3xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid var(--wp-border)", boxShadow: "0 4px 24px rgba(28,26,23,0.06)" }}>
          <div className="h-1" style={{ background: "linear-gradient(90deg, var(--wp-gold), var(--wp-bride), var(--wp-gold))" }} />

          <div className="p-6 space-y-5">
            <div className="text-center">
              <p className="text-base font-bold" style={{ color: "var(--wp-dark)" }}>يا {guestName}، أرسل هديتك بكل محبة</p>
            </div>

            {/* Mode tabs */}
            <div className="flex rounded-2xl p-1 gap-1" style={{ background: "var(--wp-surface)" }}>
              <button
                onClick={() => setMode("pay")}
                className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: mode === "pay" ? "var(--wp-dark)" : "transparent",
                  color: mode === "pay" ? "#F6F1E9" : "var(--wp-muted)",
                }}
              >
                💳 ادفع الآن
              </button>
              <button
                onClick={() => setMode("voucher")}
                className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: mode === "voucher" ? "var(--wp-dark)" : "transparent",
                  color: mode === "voucher" ? "#F6F1E9" : "var(--wp-muted)",
                }}
              >
                🎟 استخدم قسيمة
              </button>
            </div>

            {mode === "pay" ? (
              <>
                <div className="space-y-2">
                  <p className="text-[11px] font-bold tracking-wider uppercase" style={{ color: "var(--wp-muted)" }}>المبلغ (KD)</p>
                  <div className="relative" style={{
                    background: "var(--wp-surface)", borderRadius: "1rem",
                    border: `1.5px solid ${amountStr ? "var(--wp-dark)" : "var(--wp-border)"}`,
                  }}>
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold pointer-events-none" style={{ color: "var(--wp-muted)" }}>KD</span>
                    <input
                      type="number" min="0.1" max="500" step="0.001"
                      placeholder="0.000"
                      value={amountStr}
                      onChange={(e) => setAmountStr(e.target.value)}
                      className="w-full px-4 pr-14 py-4 text-xl font-bold rounded-2xl bg-transparent outline-none"
                      style={{ color: "var(--wp-dark)", fontFamily: "'Manrope',sans-serif", textAlign: "right" }}
                      inputMode="decimal"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-bold tracking-wider uppercase" style={{ color: "var(--wp-muted)" }}>رسالة <span style={{ color: "var(--wp-sub)" }}>(اختياري)</span></p>
                  <textarea rows={3} placeholder="مبروك وبالرفاه والسعادة..." value={message} onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl text-sm resize-none outline-none transition-all"
                    style={{ background: "var(--wp-surface)", border: "1.5px solid transparent", color: "var(--wp-dark)", fontFamily: "'Tajawal', sans-serif" }} />
                </div>

                {error && (
                  <div className="px-4 py-3 rounded-2xl text-sm text-center" style={{ background: "rgba(168,87,79,0.08)", color: "#A8574F", border: "1px solid rgba(168,87,79,0.2)" }}>
                    {error}
                  </div>
                )}

                <button onClick={handleSubmit} disabled={!canSubmit}
                  className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98] disabled:opacity-40"
                  style={{ background: "var(--wp-dark)", color: "#F6F1E9", fontFamily: "'Manrope',sans-serif" }}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      جاري التحويل...
                    </span>
                  ) : <>ادفع الآن{finalAmount ? ` — ${finalAmount} KD` : ""}</>}
                </button>
              </>
            ) : (
              // Voucher mode
              <>
                {voucherSuccess ? (
                  <div className="py-8 text-center space-y-3">
                    <p className="text-4xl">🎉</p>
                    <p className="font-bold text-lg" style={{ color: "var(--wp-dark)" }}>تم تطبيق القسيمة!</p>
                    <p className="text-sm" style={{ color: "var(--wp-muted)" }}>تم تسجيل هديتك بنجاح</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold tracking-wider uppercase" style={{ color: "var(--wp-muted)" }}>كود القسيمة</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="أدخل الكود..."
                          value={voucherCode}
                          onChange={(e) => { setVoucherCode(e.target.value.toUpperCase()); setVoucher(null); setVoucherError(null); }}
                          maxLength={20}
                          className="flex-1 px-4 py-3 rounded-2xl text-sm outline-none"
                          style={{
                            background: "var(--wp-surface)",
                            border: "1.5px solid var(--wp-border)",
                            color: "var(--wp-dark)",
                            fontFamily: "monospace",
                            letterSpacing: "0.1em",
                          }}
                        />
                        <button
                          onClick={validateVoucher}
                          disabled={!voucherCode.trim() || validating}
                          className="px-4 py-3 rounded-2xl text-sm font-bold transition-all disabled:opacity-40"
                          style={{ background: "var(--wp-dark)", color: "#F6F1E9" }}
                        >
                          {validating ? "..." : "تحقق"}
                        </button>
                      </div>
                      {voucherError && (
                        <p className="text-xs text-center" style={{ color: "#A8574F" }}>{voucherError}</p>
                      )}
                    </div>

                    {voucher && (
                      <div className="rounded-2xl p-4 space-y-2" style={{ background: "rgba(46,125,91,0.06)", border: "1.5px solid rgba(46,125,91,0.2)" }}>
                        <div className="flex items-center justify-between">
                          <p className="font-mono text-sm font-bold" style={{ color: "var(--wp-dark)", letterSpacing: "0.1em" }}>{voucher.code}</p>
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(46,125,91,0.12)", color: "var(--wp-green)" }}>
                            {discountLabel(voucher)}
                          </span>
                        </div>
                        {voucher.label && <p className="text-xs" style={{ color: "var(--wp-muted)" }}>{voucher.label}</p>}
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="text-[11px] font-bold tracking-wider uppercase" style={{ color: "var(--wp-muted)" }}>رسالة <span style={{ color: "var(--wp-sub)" }}>(اختياري)</span></p>
                      <textarea rows={2} placeholder="مبروك وبالرفاه..." value={message} onChange={(e) => setMessage(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl text-sm resize-none outline-none"
                        style={{ background: "var(--wp-surface)", border: "1.5px solid transparent", color: "var(--wp-dark)", fontFamily: "'Tajawal', sans-serif" }} />
                    </div>

                    <button onClick={handleVoucherGift} disabled={!voucher || loading}
                      className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98] disabled:opacity-40"
                      style={{ background: "var(--wp-dark)", color: "#F6F1E9", fontFamily: "'Manrope',sans-serif" }}>
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          جاري التسجيل...
                        </span>
                      ) : "استخدم القسيمة 🎟"}
                    </button>
                  </>
                )}
              </>
            )}
          </div>

          <div className="px-6 py-3 flex items-center justify-center gap-2" style={{ borderTop: "1px solid var(--wp-border)", background: "var(--wp-surface)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: "var(--wp-sub)" }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className="text-[11px]" style={{ color: "var(--wp-sub)" }}>
              {mode === "pay" ? "مدفوعات آمنة عبر MyFatoorah" : "قسائم وخصومات حصرية"}
            </span>
          </div>
        </div>

        <p className="text-center text-[10px] tracking-widest" style={{ color: "var(--wp-sub)" }}>WEDDINGPASS ✦</p>
      </div>
    </div>
  );
}
