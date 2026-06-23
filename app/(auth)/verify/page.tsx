"use client";

import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";

export default function VerifyPage() {
  const router = useRouter();

  return (
    <div className="w-full max-w-sm text-center space-y-6">
      <div className="bg-[#0D0D0D] rounded-2xl border border-white/[0.06] p-8 space-y-5">
        <div className="h-px bg-gradient-to-r from-transparent via-[#C5A028]/60 to-transparent" />

        <div className="w-14 h-14 rounded-2xl bg-[#C5A028]/10 border border-[#C5A028]/20 flex items-center justify-center mx-auto">
          <Mail size={24} className="text-[#C5A028]" />
        </div>

        <div className="space-y-2">
          <h1 className="text-lg font-bold text-white">تحقق من بريدك الإلكتروني</h1>
          <p className="text-sm text-white/40 leading-relaxed">
            أرسلنا لك رابط التفعيل. افتح بريدك وانقر على الرابط لتفعيل حسابك.
          </p>
        </div>

        <button
          onClick={() => router.replace("/login")}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white/60 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-colors"
        >
          العودة لتسجيل الدخول
        </button>

        <div className="h-px bg-gradient-to-r from-transparent via-[#C5A028]/30 to-transparent" />
      </div>
      <p className="text-[11px] text-white/15 tracking-widest">WEDDINGPASS ✦</p>
    </div>
  );
}
