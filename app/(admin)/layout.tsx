import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LanguageProvider } from "@/components/LanguageProvider";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const isDev = process.env.NODE_ENV === "development";

  if (!session && !isDev) redirect("/login");
  if (session && session.user.role !== "ADMIN") redirect("/");

  return (
    <LanguageProvider>
      <div className="min-h-screen" style={{ background: "#080808", color: "#F6F1E9" }}>
        {/* Admin top bar */}
        <header className="border-b border-white/[0.06] px-6 py-4 flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C5A028] to-[#F0D060] flex items-center justify-center flex-none">
            <span className="text-black text-sm font-black">W</span>
          </div>
          <span className="text-sm font-bold text-white/80">WeddingPass Admin</span>
          <nav className="flex items-center gap-1 ms-4">
            <a href="/admin/events" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white/50 hover:text-white hover:bg-white/[0.05] transition-colors">
              Events
            </a>
          </nav>
          <div className="ms-auto text-xs text-white/30">
            {session?.user.email ?? "dev mode"}
          </div>
        </header>

        <main className="p-6 max-w-5xl mx-auto">{children}</main>
      </div>
    </LanguageProvider>
  );
}
