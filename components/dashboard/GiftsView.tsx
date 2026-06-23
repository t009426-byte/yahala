"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { GiftFeed } from "@/components/dashboard/GiftFeed";
import { AddGiftSheet } from "@/components/dashboard/AddGiftSheet";
import { useLanguage } from "@/components/LanguageProvider";

export function GiftsView({ eventId }: { eventId: string }) {
  const { lang } = useLanguage();
  const [sheetOpen, setSheetOpen] = useState(false);
  const isAr = lang === "ar";

  return (
    <div className="px-4 md:px-6 py-6 space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-2">
        <div>
          <h1
            className="text-3xl leading-tight"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--wp-dark)", fontWeight: 600 }}
          >
            {isAr ? "الهدايا" : "Gifts"}
          </h1>
          <p className="text-xs mt-1 uppercase tracking-widest" style={{ color: "var(--wp-sub)" }}>
            {isAr ? "جميع الهدايا المستلمة" : "All received gifts"}
          </p>
        </div>

        <button
          onClick={() => setSheetOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm transition-all active:scale-95"
          style={{ background: "var(--wp-dark)", color: "#F6F1E9" }}
        >
          <Plus size={15} />
          {isAr ? "دفع هدية" : "Pay Gift"}
        </button>
      </div>

      <GiftFeed eventId={eventId} />

      <AddGiftSheet
        eventId={eventId}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  );
}
