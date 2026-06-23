"use client";

import { useSide } from "@/components/SideProvider";
import { useLanguage } from "@/components/LanguageProvider";

interface Props {
  coupleNames: string;
  userName: string;
}

const BRIDE_NAME_AR = "العروس";
const GROOM_NAME_AR = "العريس";
const BRIDE_NAME_EN = "Bride";
const GROOM_NAME_EN = "Groom";

export function TopBar({ userName }: Props) {
  const { side, setSide, locked } = useSide();
  const { lang, setLang } = useLanguage();

  const isAr = lang === "ar";
  const brideName = isAr ? BRIDE_NAME_AR : BRIDE_NAME_EN;
  const groomName = isAr ? GROOM_NAME_AR : GROOM_NAME_EN;
  const brideSide = isAr ? "أهل العروس" : "Bride's Side";
  const groomSide = isAr ? "أهل العريس" : "Groom's Side";

  const isBride = side === "BRIDE";
  const isGroom = side === "GROOM";

  return (
    <header
      className="flex-none flex items-center gap-3 px-4 py-3 border-b"
      style={{
        background: "var(--wp-bg)",
        borderColor: "var(--wp-border)",
        paddingTop: "max(env(safe-area-inset-top), 12px)",
      }}
    >
      {/* Side switcher */}
      <div
        className="flex-1 flex rounded-2xl p-1 gap-1"
        style={{ background: "#FFFFFF", border: "1px solid var(--wp-border)" }}
      >
        <button
          onClick={() => setSide("BRIDE")}
          disabled={locked && !isBride}
          className="flex-1 flex flex-col items-center gap-0.5 rounded-xl py-2 px-2 transition-all"
          style={{
            background: isBride ? "var(--wp-bride)" : "transparent",
            opacity: locked && !isBride ? 0.3 : 1,
            cursor: locked ? "default" : "pointer",
          }}
        >
          <span
            className="text-sm font-extrabold leading-tight transition-colors"
            style={{ color: isBride ? "#fff" : "var(--wp-dark)" }}
          >
            {brideName}
          </span>
          <span
            className="text-[9px] font-bold tracking-wide transition-colors"
            style={{ color: isBride ? "rgba(255,255,255,0.75)" : "var(--wp-muted)" }}
          >
            {brideSide}
          </span>
        </button>

        <button
          onClick={() => setSide("GROOM")}
          disabled={locked && !isGroom}
          className="flex-1 flex flex-col items-center gap-0.5 rounded-xl py-2 px-2 transition-all"
          style={{
            background: isGroom ? "var(--wp-groom)" : "transparent",
            opacity: locked && !isGroom ? 0.3 : 1,
            cursor: locked ? "default" : "pointer",
          }}
        >
          <span
            className="text-sm font-extrabold leading-tight transition-colors"
            style={{ color: isGroom ? "#fff" : "var(--wp-dark)" }}
          >
            {groomName}
          </span>
          <span
            className="text-[9px] font-bold tracking-wide transition-colors"
            style={{ color: isGroom ? "rgba(255,255,255,0.75)" : "var(--wp-muted)" }}
          >
            {groomSide}
          </span>
        </button>
      </div>

      {/* Lang toggle */}
      <div
        className="flex-none flex rounded-full p-0.5 gap-0.5"
        style={{ background: "#FFFFFF", border: "1px solid var(--wp-border)" }}
      >
        <button
          onClick={() => setLang("en")}
          className="font-extrabold text-[11px] px-2.5 py-2 rounded-full transition-all"
          style={{
            background: !isAr ? "var(--wp-dark)" : "transparent",
            color: !isAr ? "#F6F1E9" : "var(--wp-muted)",
            fontFamily: "'Manrope', sans-serif",
          }}
        >
          EN
        </button>
        <button
          onClick={() => setLang("ar")}
          className="font-extrabold text-[12px] px-2.5 py-2 rounded-full transition-all"
          style={{
            background: isAr ? "var(--wp-dark)" : "transparent",
            color: isAr ? "#F6F1E9" : "var(--wp-muted)",
            fontFamily: "'Tajawal', sans-serif",
          }}
        >
          عربي
        </button>
      </div>

      {/* User avatar */}
      <div
        className="flex-none w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm select-none"
        style={{
          background: "var(--wp-dark)",
          color: "#F6F1E9",
          fontFamily: "'Manrope', sans-serif",
        }}
      >
        {userName[0]?.toUpperCase() ?? "م"}
      </div>
    </header>
  );
}
