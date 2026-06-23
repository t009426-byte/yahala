"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Step = "plus-one" | "confirming" | "confirmed" | "declined";

interface Props {
  token: string;
  action: "attend" | "decline";
  guestName: string;
  coupleNames: string;
  plusOneAllowed: boolean;
}

export function RSVPFlow({ token, action, guestName, coupleNames, plusOneAllowed }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(() => {
    if (action === "decline") return "declined";
    if (plusOneAllowed) return "plus-one";
    return "confirming";
  });
  const [plusOneConfirmed, setPlusOneConfirmed] = useState<boolean | null>(null);
  const [plusOneName, setPlusOneName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-confirm when no plus-one question is needed
  useEffect(() => {
    if (step === "confirming") {
      void confirm(undefined, undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function confirm(plusOne?: boolean, name?: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          ...(typeof plusOne === "boolean" && { plusOneConfirmed: plusOne }),
          ...(name && { plusOneName: name }),
        }),
      });
      if (!res.ok) throw new Error("failed");
      setStep("confirmed");
    } catch {
      setError("حدث خطأ غير متوقع. حاول مجدداً.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "declined") {
    return (
      <div className="min-h-screen bg-gradient-wedding flex items-center justify-center p-4">
        <div className="text-center space-y-5 max-w-sm animate-fade-in">
          <p className="text-6xl">💐</p>
          <h1
            className="text-2xl font-bold text-foreground"
            style={{ fontFamily: "'Amiri', serif" }}
          >
            شكراً لإعلامنا
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            نأسف لغيابك يا {guestName}، ونتمنى لك دوام الصحة والسعادة.
          </p>
          <p className="text-sm text-muted-foreground/60 tracking-wide">
            — {coupleNames}
          </p>
          <p className="text-center text-xs text-muted-foreground/40 mt-8 tracking-widest">
            WEDDINGPASS ✦
          </p>
        </div>
      </div>
    );
  }

  if (step === "confirming") {
    return (
      <div className="min-h-screen bg-gradient-wedding flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-700 rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">جاري تأكيد حضورك...</p>
        </div>
      </div>
    );
  }

  if (step === "confirmed") {
    return (
      <div className="min-h-screen bg-gradient-wedding flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center space-y-6 animate-fade-in">
          <div className="w-20 h-20 bg-emerald-100 border-4 border-emerald-200 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <span className="text-4xl">✅</span>
          </div>
          <div className="space-y-2">
            <h1
              className="text-2xl font-bold text-foreground"
              style={{ fontFamily: "'Amiri', serif" }}
            >
              تم تأكيد حضورك!
            </h1>
            <p className="text-muted-foreground leading-relaxed text-sm">
              يسعدنا حضورك يا {guestName}
              <br />
              تذكرتك الرقمية جاهزة للدخول
            </p>
          </div>
          <button
            onClick={() => router.push(`/pass/${token}`)}
            className={[
              "w-full py-4 rounded-xl text-white font-bold text-lg",
              "bg-primary-700 hover:bg-primary-800 active:scale-[0.98]",
              "transition-all duration-200 shadow-lg shadow-primary-300/30",
              "flex items-center justify-center gap-2",
            ].join(" ")}
          >
            <span>🎫</span>
            <span>عرض تذكرة الدخول</span>
          </button>
          <p className="text-xs text-muted-foreground">
            ستصلك أيضاً على واتساب
          </p>
          <p className="text-center text-xs text-muted-foreground/40 mt-4 tracking-widest">
            WEDDINGPASS ✦
          </p>
        </div>
      </div>
    );
  }

  // ── Plus-one question step ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-wedding flex items-center justify-center p-4">
      <div className="w-full max-w-sm overflow-hidden animate-fade-in">
        <div className="glass rounded-2xl shadow-2xl shadow-primary-200/30 border border-white/60 overflow-hidden">
          <div className="h-1.5 bg-gradient-gold" />

          <div className="px-6 pt-8 pb-10 space-y-6 text-center">
            <div className="space-y-2">
              <p className="text-4xl">👥</p>
              <h2
                className="text-xl font-bold text-foreground"
                style={{ fontFamily: "'Amiri', serif" }}
              >
                هل ستأتي مع ضيف؟
              </h2>
              <p className="text-sm text-muted-foreground">
                مرحباً {guestName}، يمكنك إحضار شخص معك
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setPlusOneConfirmed(true)}
                className={[
                  "w-full py-4 rounded-xl text-base font-semibold border-2 transition-all duration-150",
                  plusOneConfirmed === true
                    ? "bg-primary-700 text-white border-primary-700 shadow-lg"
                    : "bg-white text-foreground border-input hover:border-primary-300",
                ].join(" ")}
              >
                ✅ نعم، سآتي مع ضيف
              </button>
              <button
                onClick={() => {
                  setPlusOneConfirmed(false);
                  setPlusOneName("");
                }}
                className={[
                  "w-full py-4 rounded-xl text-base font-semibold border-2 transition-all duration-150",
                  plusOneConfirmed === false
                    ? "bg-gray-700 text-white border-gray-700"
                    : "bg-white text-foreground border-input hover:border-gray-300",
                ].join(" ")}
              >
                سأحضر بمفردي
              </button>
            </div>

            {plusOneConfirmed === true && (
              <div className="space-y-1.5 animate-fade-in text-right">
                <label className="block text-sm font-medium text-foreground">
                  اسم الضيف <span className="text-muted-foreground font-normal">(اختياري)</span>
                </label>
                <input
                  type="text"
                  value={plusOneName}
                  onChange={(e) => setPlusOneName(e.target.value)}
                  placeholder="اكتب اسم من ستحضر معه..."
                  className="w-full px-4 py-3 rounded-xl border border-input text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all text-right"
                />
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <button
              onClick={() =>
                confirm(
                  plusOneConfirmed ?? undefined,
                  plusOneName || undefined
                )
              }
              disabled={plusOneConfirmed === null || loading}
              className={[
                "w-full py-4 rounded-xl text-white font-bold text-lg",
                "bg-primary-700 hover:bg-primary-800 active:scale-[0.98]",
                "transition-all duration-200 shadow-lg shadow-primary-300/30",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "flex items-center justify-center gap-2",
              ].join(" ")}
            >
              {loading ? (
                <>
                  <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full inline-block" />
                  <span>جاري التأكيد...</span>
                </>
              ) : (
                "تأكيد الحضور ✓"
              )}
            </button>
          </div>

          <div className="h-1 bg-gradient-gold opacity-60" />
        </div>

        <p className="text-center text-xs text-muted-foreground/40 mt-4 tracking-widest">
          WEDDINGPASS ✦
        </p>
      </div>
    </div>
  );
}
