"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Users, Gift, QrCode, LogOut, CalendarHeart } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { t } from "@/lib/translations";
import type { UserRole } from "@/types";

interface SidebarProps {
  role: UserRole;
  name?: string | null;
  label?: string | null;
}

export function Sidebar({ role, name, label }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { lang } = useLanguage();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const NAV = [
    { href: "/",       icon: LayoutDashboard, key: "nav_dashboard" as const },
    { href: "/guests", icon: Users,            key: "nav_guests"   as const },
    { href: "/gifts",  icon: Gift,             key: "nav_gifts"    as const },
    { href: "/gate",   icon: QrCode,           key: "nav_gate"     as const },
    { href: "/event",  icon: CalendarHeart,    key: "nav_event"    as const },
  ];

  const ROLE_LABEL: Record<UserRole, string> = {
    ADMIN:        lang === "ar" ? "مدير النظام"    : "Admin",
    ORGANIZER:    lang === "ar" ? "منظّم"          : "Organizer",
    COUPLE:       lang === "ar" ? "العروسان"       : "Couple",
    BRIDE_FAMILY: lang === "ar" ? "أهل العروس"     : "Bride's Family",
    GROOM_FAMILY: lang === "ar" ? "أهل العريس"     : "Groom's Family",
    GATE_STAFF:   lang === "ar" ? "موظف بوابة"     : "Gate Staff",
  };

  return (
    <aside
      className="hidden md:flex flex-col w-56 shrink-0 border-e"
      style={{ background: "#FFFFFF", borderColor: "var(--wp-border)" }}
    >
      {/* Brand */}
      <div className="px-5 py-5 border-b" style={{ borderColor: "var(--wp-border)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "var(--wp-dark)" }}
          >
            <span
              className="text-xs font-black"
              style={{ color: "#F6F1E9", fontFamily: "'Cormorant Garamond',serif" }}
            >
              W
            </span>
          </div>
          <div>
            <p
              className="font-bold text-sm tracking-wide leading-tight"
              style={{ color: "var(--wp-dark)", fontFamily: "'Manrope',sans-serif" }}
            >
              WeddingPass
            </p>
            <p
              className="text-[10px] mt-0.5 tracking-widest uppercase"
              style={{ color: "var(--wp-sub)" }}
            >
              {t(lang, "admin_portal")}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(({ href, icon: Icon, key }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: isActive ? "var(--wp-dark)" : "transparent",
                color: isActive ? "#F6F1E9" : "var(--wp-muted)",
              }}
            >
              <Icon size={16} className="shrink-0" />
              <span>{t(lang, key)}</span>
            </Link>
          );
        })}
      </nav>

      {/* User + sign out */}
      <div className="p-3 border-t space-y-1" style={{ borderColor: "var(--wp-border)" }}>
        <div
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
          style={{ background: "var(--wp-bg)", border: "1px solid var(--wp-border)" }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: "var(--wp-dark)", color: "#F6F1E9" }}
          >
            {name?.[0]?.toUpperCase() ?? "؟"}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: "var(--wp-dark)" }}>
              {name ?? "مستخدم"}
            </p>
            <p className="text-[10px] truncate" style={{ color: "var(--wp-sub)" }}>
              {label ?? ROLE_LABEL[role]}
            </p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 w-full px-3.5 py-2 rounded-xl text-xs transition-colors"
          style={{ color: "var(--wp-sub)" }}
        >
          <LogOut size={13} />
          <span>{t(lang, "sign_out")}</span>
        </button>
      </div>
    </aside>
  );
}
