import Link from "next/link";

export const metadata = {
  title: "خطأ في الدفع | WeddingPass",
};

export default function GiftErrorPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: "var(--wp-bg)", fontFamily: "'Manrope', sans-serif" }}
      dir="rtl"
    >
      <div className="w-full max-w-sm text-center space-y-8">
        <p className="text-[11px] font-bold tracking-[3px] uppercase" style={{ color: "var(--wp-sub)" }}>
          WeddingPass ✦
        </p>

        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mx-auto"
          style={{ background: "rgba(168,87,79,0.1)", border: "3px solid rgba(168,87,79,0.2)" }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" style={{ color: "#A8574F" }}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        <div className="space-y-2">
          <h1
            className="text-4xl leading-tight"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--wp-dark)", fontWeight: 600 }}
          >
            حدث خطأ
          </h1>
          <p className="text-sm" style={{ color: "var(--wp-muted)" }}>
            لم تكتمل عملية الدفع. يرجى المحاولة مرة أخرى.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98]"
          style={{ background: "var(--wp-dark)", color: "#F6F1E9" }}
        >
          العودة للرئيسية
        </Link>

        <p className="text-[10px] tracking-widest" style={{ color: "var(--wp-sub)" }}>
          WEDDINGPASS ✦
        </p>
      </div>
    </div>
  );
}
