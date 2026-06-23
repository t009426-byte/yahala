"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Lang } from "@/lib/translations";

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const LangContext = createContext<LangContextValue>({
  lang: "ar",
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("weddingpass_lang") as Lang | null;
    if (stored === "en" || stored === "ar") {
      setLangState(stored);
      applyDir(stored);
    }
  }, []);

  function setLang(next: Lang) {
    setLangState(next);
    localStorage.setItem("weddingpass_lang", next);
    applyDir(next);
  }

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

function applyDir(lang: Lang) {
  const dir = lang === "ar" ? "rtl" : "ltr";
  document.documentElement.dir = dir;
  document.documentElement.lang = lang;
}

export function useLanguage() {
  return useContext(LangContext);
}
