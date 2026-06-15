"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDevOtp(null);

    const normalized = phone.replace(/[\s\-\(\)]/g, "");
    if (normalized.length < 8) {
      setError("يرجى إدخال رقم هاتف صحيح");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: normalized }),
        });

        const data = (await res.json()) as {
          success?: boolean;
          error?: string;
          waitSeconds?: number;
          _dev_otp?: string;
        };

        if (!res.ok) {
          setError(data.error ?? "حدث خطأ غير متوقع");
          return;
        }

        if (data._dev_otp) setDevOtp(data._dev_otp);

        router.push(`/verify?phone=${encodeURIComponent(normalized)}`);
      } catch {
        setError("تعذّر الاتصال بالخادم. حاول مجدداً.");
      }
    });
  }

  return (
    <div className="w-full max-w-sm animate-fade-in">
      {/* Card */}
      <div className="glass rounded-2xl shadow-2xl shadow-primary-200/30 overflow-hidden border border-white/60">
        <div className="h-1.5 bg-gradient-gold" />

        <div className="px-6 pt-8 pb-10 space-y-6 text-center">
          {/* Logo */}
          <div className="space-y-1">
            <p className="text-3xl">💍</p>
            <h1 className="text-xl font-bold text-primary-700 tracking-wide">
              WeddingPass
            </h1>
            <p className="text-xs text-muted-foreground tracking-widest uppercase">
              بوابة الإدارة
            </p>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-primary-200 to-transparent" />

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-right">
            <div className="space-y-1.5">
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-foreground"
              >
                رقم الهاتف
              </label>

              {/* Phone input with country prefix */}
              <div className="flex rounded-xl overflow-hidden border border-input bg-white focus-within:ring-2 focus-within:ring-primary-300 focus-within:border-primary-400 transition-all">
                <div className="flex items-center gap-1.5 px-3 bg-muted/50 border-l border-input shrink-0">
                  <span className="text-base">🇰🇼</span>
                  <span className="text-sm font-mono text-muted-foreground">+965</span>
                </div>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="XXXXXXXX"
                  autoComplete="tel"
                  className="flex-1 px-3 py-3 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive text-right">
                {error}
              </div>
            )}

            {devOtp && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800 text-center font-mono">
                🧪 Dev OTP: <strong>{devOtp}</strong>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className={[
                "w-full py-3.5 rounded-xl text-white font-bold text-base",
                "bg-primary-700 hover:bg-primary-800 active:scale-[0.98]",
                "transition-all duration-200 shadow-lg shadow-primary-300/30",
                "disabled:opacity-70 disabled:cursor-not-allowed",
                "flex items-center justify-center gap-2",
              ].join(" ")}
            >
              {isPending ? (
                <>
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" />
                  <span>جاري الإرسال...</span>
                </>
              ) : (
                <>
                  <span>📲</span>
                  <span>إرسال رمز التحقق</span>
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-muted-foreground leading-relaxed">
            سيصلك رمز مكوّن من 6 أرقام
            <br />
            عبر واتساب على هذا الرقم
          </p>
        </div>

        <div className="h-1 bg-gradient-gold opacity-50" />
      </div>

      <p className="text-center text-xs text-muted-foreground/40 mt-4 tracking-widest">
        WEDDINGPASS ✦
      </p>
    </div>
  );
}
