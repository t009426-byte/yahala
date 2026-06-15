"use client";

import { useState, useRef, useEffect, useTransition, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense } from "react";

// ─── OTP digit input ──────────────────────────────────────────────────────────

function OTPInput({
  value,
  onChange,
  onComplete,
  disabled,
}: {
  value: string[];
  onChange: (digits: string[]) => void;
  onComplete: (otp: string) => void;
  disabled: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(index: number, raw: string) {
    // Allow paste of full OTP
    if (raw.length === 6 && /^\d{6}$/.test(raw)) {
      const digits = raw.split("");
      onChange(digits);
      refs.current[5]?.focus();
      onComplete(raw);
      return;
    }

    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = [...value];
    next[index] = digit;
    onChange(next);

    if (digit && index < 5) {
      refs.current[index + 1]?.focus();
    }

    if (next.every((d) => d !== "") && next.length === 6) {
      onComplete(next.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const digits = pasted.split("");
      onChange(digits);
      refs.current[5]?.focus();
      onComplete(pasted);
    }
  }

  return (
    <div className="flex gap-2 justify-center" dir="ltr">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={[
            "w-11 h-14 text-center text-xl font-bold rounded-xl border-2",
            "transition-all duration-150 outline-none",
            "bg-white placeholder:text-muted-foreground/30",
            value[i]
              ? "border-primary-500 text-primary-700 bg-primary-50/40"
              : "border-input text-foreground",
            "focus:border-primary-500 focus:ring-2 focus:ring-primary-200",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          ].join(" ")}
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}

// ─── Resend timer ─────────────────────────────────────────────────────────────

function ResendButton({
  phone,
  onResent,
}: {
  phone: string;
  onResent: () => void;
}) {
  const [seconds, setSeconds] = useState(60);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1_000);
    return () => clearTimeout(id);
  }, [seconds]);

  async function resend() {
    setResending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = (await res.json()) as { error?: string; waitSeconds?: number };
      if (!res.ok) {
        setError(data.error ?? "فشل الإرسال");
        if (data.waitSeconds) setSeconds(data.waitSeconds);
      } else {
        setSeconds(60);
        onResent();
      }
    } catch {
      setError("تعذّر الاتصال");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="space-y-1 text-center">
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
      {seconds > 0 ? (
        <p className="text-sm text-muted-foreground">
          إعادة الإرسال بعد{" "}
          <span className="font-mono font-semibold text-primary-700 tabular-nums">
            {String(seconds).padStart(2, "0")}s
          </span>
        </p>
      ) : (
        <button
          onClick={resend}
          disabled={resending}
          className="text-sm text-primary-700 hover:text-primary-900 underline underline-offset-2 disabled:opacity-60 font-medium"
        >
          {resending ? "جاري الإرسال..." : "إعادة إرسال الرمز"}
        </button>
      )}
    </div>
  );
}

// ─── Inner page (needs useSearchParams) ──────────────────────────────────────

function VerifyPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") ?? "";
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [resendKey, setResendKey] = useState(0);

  useEffect(() => {
    if (!phone) router.replace("/login");
  }, [phone, router]);

  const submit = useCallback(
    (otp: string) => {
      if (otp.length !== 6 || isPending) return;
      setError(null);

      startTransition(async () => {
        const result = await signIn("phone-otp", {
          phone,
          otp,
          redirect: false,
          callbackUrl,
        });

        if (result?.error) {
          setError("رمز التحقق غير صحيح أو منتهي الصلاحية. حاول مجدداً.");
          setDigits(Array(6).fill(""));
        } else if (result?.url) {
          router.replace(result.url);
        } else {
          router.replace(callbackUrl);
        }
      });
    },
    [isPending, phone, callbackUrl, router]
  );

  const maskedPhone = phone.replace(/(\d{3})\d+(\d{4})/, "$1****$2");

  return (
    <div className="w-full max-w-sm animate-fade-in">
      <div className="glass rounded-2xl shadow-2xl shadow-primary-200/30 overflow-hidden border border-white/60">
        <div className="h-1.5 bg-gradient-gold" />

        <div className="px-6 pt-8 pb-10 space-y-6 text-center">
          {/* Header */}
          <div className="space-y-2">
            <div className="w-14 h-14 rounded-full bg-primary-50 border-2 border-primary-200 flex items-center justify-center mx-auto">
              <span className="text-2xl">📲</span>
            </div>
            <h1 className="text-xl font-bold text-foreground">أدخل رمز التحقق</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              أُرسل رمز مكوّن من 6 أرقام
              <br />
              إلى واتساب{" "}
              <span className="font-mono font-semibold text-foreground dir-ltr inline-block" dir="ltr">
                +{maskedPhone}
              </span>
            </p>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-primary-200 to-transparent" />

          {/* OTP Input */}
          <OTPInput
            value={digits}
            onChange={setDigits}
            onComplete={submit}
            disabled={isPending}
          />

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            onClick={() => submit(digits.join(""))}
            disabled={isPending || digits.some((d) => !d)}
            className={[
              "w-full py-3.5 rounded-xl text-white font-bold text-base",
              "bg-primary-700 hover:bg-primary-800 active:scale-[0.98]",
              "transition-all duration-200 shadow-lg shadow-primary-300/30",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center justify-center gap-2",
            ].join(" ")}
          >
            {isPending ? (
              <>
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" />
                <span>جاري التحقق...</span>
              </>
            ) : (
              "تأكيد الدخول ✓"
            )}
          </button>

          {/* Resend */}
          <ResendButton
            key={resendKey}
            phone={phone}
            onResent={() => {
              setResendKey((k) => k + 1);
              setDigits(Array(6).fill(""));
              setError(null);
            }}
          />

          {/* Back link */}
          <button
            onClick={() => router.back()}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            ← تغيير رقم الهاتف
          </button>
        </div>

        <div className="h-1 bg-gradient-gold opacity-50" />
      </div>

      <p className="text-center text-xs text-muted-foreground/40 mt-4 tracking-widest">
        WEDDINGPASS ✦
      </p>
    </div>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-sm glass rounded-2xl p-10 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
        </div>
      }
    >
      <VerifyPageInner />
    </Suspense>
  );
}
