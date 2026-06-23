import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import type { GuestSide } from "@/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isDev = process.env.NODE_ENV === "development";
  if (!session && !isDev) redirect("/login");

  if (session && !session.user.eventId) redirect("/join");

  const coupleNames = "فهد & نورة"; // fallback — hero fetches live

  const userRole = session?.user?.role ?? "COUPLE";
  const defaultSide: GuestSide = userRole === "GROOM_FAMILY" ? "GROOM" : "BRIDE";
  const locked = userRole === "BRIDE_FAMILY" || userRole === "GROOM_FAMILY";

  return (
    <DashboardShell defaultSide={defaultSide} locked={locked}>
      <div className="flex h-dvh overflow-hidden" style={{ background: "var(--wp-bg)" }}>
        {/* Desktop sidebar */}
        <Sidebar
          role={session?.user?.role ?? "COUPLE"}
          name={session?.user?.name ?? "معاينة"}
          label={session?.user?.label}
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top bar: side switcher + lang toggle */}
          <TopBar coupleNames={coupleNames} userName={session?.user?.name ?? "م"} />

          {/* Scrollable page content */}
          <main className="flex-1 overflow-y-auto scroll-hide">{children}</main>
        </div>

        <MobileBottomNav />
      </div>
    </DashboardShell>
  );
}
