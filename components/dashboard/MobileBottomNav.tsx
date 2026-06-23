"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Gift, QrCode, CalendarHeart } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { t } from "@/lib/translations";

const TABS = [
  { href: "/",       icon: LayoutDashboard, key: "nav_dashboard" as const },
  { href: "/guests", icon: Users,           key: "nav_guests"    as const },
  { href: "/gifts",  icon: Gift,            key: "nav_gifts"     as const },
  { href: "/gate",   icon: QrCode,          key: "nav_gate"      as const },
  { href: "/event",  icon: CalendarHeart,   key: "nav_event"     as const },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  const { lang } = useLanguage();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 flex items-stretch"
      style={{
        background: "rgba(246,241,233,0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(28,26,23,0.07)",
        paddingBottom: "max(env(safe-area-inset-bottom), 0px)",
      }}
    >
      {TABS.map(({ href, icon: Icon, key }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 px-1 transition-all"
            style={{ color: isActive ? "var(--wp-dark)" : "var(--wp-sub)" }}
          >
            <Icon size={22} strokeWidth={isActive ? 2.2 : 1.5} />
            <span
              className="text-[9.5px] font-bold leading-none tracking-wide"
              style={{ fontFamily: lang === "ar" ? "'Tajawal',sans-serif" : "'Manrope',sans-serif" }}
            >
              {t(lang, key)}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
