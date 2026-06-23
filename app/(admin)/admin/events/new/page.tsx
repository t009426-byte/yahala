"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarHeart, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

const INPUT = "w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all border border-white/[0.08] bg-white/[0.04] text-white/80 placeholder:text-white/20 focus:border-[#C5A028]/50 focus:bg-white/[0.06]";
const LABEL = "block text-xs font-semibold text-white/40 mb-1.5 uppercase tracking-wider";

export default function NewEventPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    coupleNames: "", name: "", date: "", time: "19:00",
    venue: "", capacity: "300", invitationText: "",
  });

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name || form.coupleNames,
          coupleNames: form.coupleNames,
          date: new Date(`${form.date}T${form.time}:00`).toISOString(),
          venue: form.venue,
          capacity: Number(form.capacity),
          invitationText: form.invitationText || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        setError(d.error ?? "Failed to create event");
        return;
      }
      const { data } = await res.json() as { data: { id: string } };
      router.push(`/admin/events/${data.id}`);
    });
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/events" className="text-white/30 hover:text-white/60 transition-colors">
          <ArrowRight size={16} className="rotate-180" />
        </Link>
        <h1 className="text-xl font-bold text-white">New Event</h1>
      </div>

      <form onSubmit={handleCreate} className="space-y-5">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
          <p className="text-xs font-bold text-[#C5A028] uppercase tracking-widest">Couple & Event</p>

          <div>
            <label className={LABEL}>Couple Names *</label>
            <input type="text" value={form.coupleNames} onChange={set("coupleNames")}
              placeholder="أحمد ومريم / Ahmed & Mariam" required className={INPUT} />
          </div>

          <div>
            <label className={LABEL}>Event Name</label>
            <input type="text" value={form.name} onChange={set("name")}
              placeholder="Wedding of Ahmed & Mariam (defaults to couple names)" className={INPUT} />
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
          <p className="text-xs font-bold text-[#C5A028] uppercase tracking-widest">Date & Venue</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Date *</label>
              <input type="date" value={form.date} onChange={set("date")} required
                className={[INPUT, "[color-scheme:dark]"].join(" ")} />
            </div>
            <div>
              <label className={LABEL}>Time</label>
              <input type="time" value={form.time} onChange={set("time")}
                className={[INPUT, "[color-scheme:dark]"].join(" ")} />
            </div>
          </div>

          <div>
            <label className={LABEL}>Venue *</label>
            <input type="text" value={form.venue} onChange={set("venue")}
              placeholder="Grand Ballroom, Al-Hamra Palace..." required className={INPUT} />
          </div>

          <div>
            <label className={LABEL}>Capacity</label>
            <input type="number" min={1} max={10000} value={form.capacity} onChange={set("capacity")}
              className={INPUT} />
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
          <p className="text-xs font-bold text-[#C5A028] uppercase tracking-widest">Invitation Message</p>
          <p className="text-xs text-white/30">Shown on guests' digital invitation cards (QR pass)</p>
          <textarea
            rows={4}
            value={form.invitationText}
            onChange={set("invitationText")}
            placeholder="نسعد بدعوتكم لحضور حفل زفاف..."
            className={[INPUT, "resize-none"].join(" ")}
            dir="auto"
          />
        </div>

        {error && (
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-sm text-rose-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 rounded-xl font-bold text-sm bg-[#C5A028] hover:bg-[#D4B030] text-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isPending ? <Loader2 size={15} className="animate-spin" /> : <CalendarHeart size={15} />}
          {isPending ? "Creating..." : "Create Event & Generate Codes"}
        </button>
      </form>
    </div>
  );
}
