"use client";

import { useLanguage } from "@/components/LanguageProvider";

export function LangToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <button
      onClick={() => setLang(lang === "ar" ? "en" : "ar")}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white/40 hover:text-white/70 hover:bg-white/[0.08] transition-all text-xs font-medium tracking-wide"
      title={lang === "ar" ? "Switch to English" : "التبديل للعربية"}
    >
      <span className="text-[10px]">{lang === "ar" ? "🇺🇸" : "🇰🇼"}</span>
      <span>{lang === "ar" ? "EN" : "ع"}</span>
    </button>
  );
}
