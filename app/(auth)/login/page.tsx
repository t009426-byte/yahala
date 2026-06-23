"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";

type Tab = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const supabase = createClient();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim() || !password) {
      setError("يرجى إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }
    if (password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    startTransition(async () => {
      if (tab === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) {
          setError(
            error.message.includes("Invalid login")
              ? "البريد الإلكتروني أو كلمة المرور غير صحيحة"
              : "حدث خطأ. حاول مجدداً."
          );
        } else {
          router.replace("/");
          router.refresh();
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${location.origin}/auth/callback`,
          },
        });
        if (error) {
          setError(
            error.message.includes("already registered")
              ? "هذا البريد الإلكتروني مسجّل مسبقاً. جرّب تسجيل الدخول."
              : "حدث خطأ أثناء إنشاء الحساب. حاول مجدداً."
          );
        } else {
          setSuccess("تم إنشاء الحساب! تحقق من بريدك الإلكتروني لتفعيل الحساب.");
        }
      }
    });
  }

  return (
    <div className="w-full max-w-sm">
      {/* Brand */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#C5A028] to-[#F0D060] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#C5A028]/20">
          <span className="text-black text-2xl font-black tracking-tighter">W</span>
        </div>
        <h1 className="text-xl font-bold text-white tracking-wide">WeddingPass</h1>
        <p className="text-xs text-white/30 tracking-widest uppercase mt-1">بوابة الإدارة</p>
      </div>

      {/* Card */}
      <div className="bg-[#0D0D0D] rounded-2xl border border-white/[0.06] overflow-hidden shadow-2xl">
        {/* Gold top line */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#C5A028]/60 to-transparent" />

        <div className="p-6 space-y-5">
          {/* Tabs */}
          <div className="flex bg-white/[0.04] rounded-xl p-1 gap-1">
            {(["login", "register"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); setSuccess(null); }}
                className={[
                  "flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
                  tab === t
                    ? "bg-[#C5A028] text-black shadow-sm"
                    : "text-white/40 hover:text-white/60",
                ].join(" ")}
              >
                {t === "login" ? "تسجيل الدخول" : "حساب جديد"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-white/50 tracking-wide">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail size={14} className="absolute top-1/2 -translate-y-1/2 end-3.5 text-white/20 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  dir="ltr"
                  autoComplete="email"
                  required
                  className="w-full pe-9 ps-4 py-3 text-sm rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/80 placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-[#C5A028]/40 focus:border-[#C5A028]/40 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-white/50 tracking-wide">
                كلمة المرور
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 -translate-y-1/2 end-3.5 text-white/20 hover:text-white/50 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <Lock size={14} className="absolute top-1/2 -translate-y-1/2 start-3.5 text-white/20 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  autoComplete={tab === "login" ? "current-password" : "new-password"}
                  required
                  minLength={6}
                  className="w-full pe-9 ps-9 py-3 text-sm rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/80 placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-[#C5A028]/40 focus:border-[#C5A028]/40 transition-all"
                />
              </div>
              {tab === "register" && (
                <p className="text-[11px] text-white/25 ps-1">6 أحرف على الأقل</p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 text-sm text-rose-400 text-center">
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 text-sm text-emerald-400 text-center leading-relaxed">
                {success}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 rounded-xl font-bold text-sm bg-[#C5A028] hover:bg-[#D4B030] active:scale-[0.98] text-black transition-all duration-200 shadow-lg shadow-[#C5A028]/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : tab === "login" ? (
                "دخول"
              ) : (
                "إنشاء الحساب"
              )}
            </button>
          </form>
        </div>

        {/* Gold bottom line */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#C5A028]/30 to-transparent" />
      </div>

      <p className="text-center text-[11px] text-white/15 mt-6 tracking-widest">
        WEDDINGPASS ✦
      </p>
    </div>
  );
}
