import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

interface PageProps {
  params: { token: string };
}

export const metadata = {
  title: "شكراً على هديتك | WeddingPass",
  robots: { index: false, follow: false },
};

export default async function GiftThankYouPage({ params }: PageProps) {
  const guest = await prisma.guest.findUnique({
    where: { qrToken: decodeURIComponent(params.token) },
    select: {
      name: true,
      qrToken: true,
      event: { select: { coupleNames: true } },
    },
  });

  if (!guest) notFound();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: "var(--wp-bg)", fontFamily: "'Manrope', sans-serif" }}
      dir="rtl"
    >
      <div className="w-full max-w-sm text-center space-y-8">

        {/* Top label */}
        <p className="text-[11px] font-bold tracking-[3px] uppercase" style={{ color: "var(--wp-sub)" }}>
          WeddingPass ✦
        </p>

        {/* Icon */}
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mx-auto"
          style={{ background: "rgba(46,125,91,0.1)", border: "3px solid rgba(46,125,91,0.2)" }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ color: "var(--wp-green)" }}>
            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1
            className="text-4xl leading-tight"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--wp-dark)", fontWeight: 600 }}
          >
            شكراً جزيلاً
          </h1>
          <p className="text-base" style={{ color: "var(--wp-muted)" }}>
            تم استلام هديتك يا {guest.name}
          </p>
          <p className="text-sm" style={{ color: "var(--wp-sub)" }}>
            {guest.event.coupleNames}
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-6 text-center space-y-2"
          style={{ background: "#FFFFFF", border: "1px solid var(--wp-border)" }}
        >
          <p className="text-lg" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--wp-dark)", fontStyle: "italic" }}>
            &ldquo;بارك الله لهما وبارك عليهما&rdquo;
          </p>
          <p className="text-xs" style={{ color: "var(--wp-sub)" }}>
            دعاء للعروسين بالتوفيق والسعادة
          </p>
        </div>

        {/* Back to pass */}
        <Link
          href={`/pass/${guest.qrToken}`}
          className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98]"
          style={{ background: "var(--wp-dark)", color: "#F6F1E9" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          العودة لتذكرتي
        </Link>

        <p className="text-[10px] tracking-widest" style={{ color: "var(--wp-sub)" }}>
          WEDDINGPASS ✦
        </p>
      </div>
    </div>
  );
}
