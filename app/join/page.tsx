"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Key, Loader2 } from "lucide-react";

const INPUT =
  "w-full px-4 py-3 text-sm rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/80 placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-[#C5A028]/40 focus:border-[#C5A028]/40 transition-all";

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), label: label.trim() || undefined }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        setError(d.error === "Invalid invite code" ? "الكود غير صحيح. تحقق منه وحاول مجدداً." : "حدث خطأ. حاول مجدداً.");
        return;
      }
      router.replace("/");
      router.refresh();
    });
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#C5A028] to-[#F0D060] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#C5A028]/20">
            <span className="text-black text-2xl font-black">W</span>
          </div>
          <h1 className="text-xl font-bold text-white">WeddingPass</h1>
          <p className="text-xs text-white/30 mt-1">أدخل كود الدعوة الذي أرسله لك المنظّم</p>
        </div>

        <div className="bg-[#0D0D0D] rounded-2xl border border-white/[0.06] overflow-hidden shadow-2xl">
          <div className="h-px bg-gradient-to-r from-transparent via-[#C5A028]/60 to-transparent" />

          <form onSubmit={handleJoin} className="p-6 space-y-5" dir="rtl">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-white/50">كود الدعوة</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="مثال: AB2XKQ"
                required
                className={INPUT}
                dir="ltr"
                maxLength={20}
                style={{ letterSpacing: "0.12em", fontFamily: "monospace" }}
              />
              <p className="text-[11px] text-white/25">يمكنك الحصول على الكود من منظّم الحفل</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-white/50">اسمك أو تعريفك (اختياري)</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="مثال: أهل العريس من جهة الأب"
                className={INPUT}
                dir="rtl"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 text-sm text-rose-400 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending || !code.trim()}
              className="w-full py-3 rounded-xl font-bold text-sm bg-[#C5A028] hover:bg-[#D4B030] text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending ? <Loader2 size={16} className="animate-spin" /> : <Key size={15} />}
              {isPending ? "جاري الانضمام..." : "انضمام للفعالية"}
            </button>
          </form>

          <div className="h-px bg-gradient-to-r from-transparent via-[#C5A028]/30 to-transparent" />
        </div>

        <button
          onClick={handleSignOut}
          className="block mx-auto mt-4 text-xs text-white/20 hover:text-white/40 transition-colors"
        >
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}
