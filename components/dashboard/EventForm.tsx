"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { t } from "@/lib/translations";
import {
  Heart, MapPin, Calendar, Clock, Users, Save, Loader2, CheckCircle2, Copy, Check, Link2,
} from "lucide-react";

interface EventData {
  id: string; name: string; coupleNames: string; date: Date;
  venue: string; capacity: number;
}

interface Props { event: EventData | null }

function ShareCode({ eventId, lang }: { eventId: string; lang: import("@/lib/translations").Lang }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(eventId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="bg-[#C5A028]/[0.06] border border-[#C5A028]/20 rounded-2xl p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Link2 size={13} className="text-[#C5A028]" />
        <p className="text-xs font-semibold text-[#C5A028] tracking-wide uppercase">
          {lang === "ar" ? "كود دعوة أفراد العائلة" : "Family Invite Code"}
        </p>
      </div>
      <p className="text-[11px] text-white/35 leading-relaxed">
        {lang === "ar"
          ? "شارك هذا الكود مع أفراد العائلة ليتمكنوا من الانضمام وإضافة المدعوين"
          : "Share this code with family members so they can join and add guests"}
      </p>
      <div className="flex items-center gap-2 mt-1">
        <code className="flex-1 px-3 py-2 rounded-xl bg-black/30 border border-white/[0.06] text-xs text-[#C5A028] font-mono tracking-widest truncate" dir="ltr">
          {eventId}
        </code>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 w-9 h-9 rounded-xl border border-[#C5A028]/30 bg-[#C5A028]/10 hover:bg-[#C5A028]/20 flex items-center justify-center transition-all"
        >
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-[#C5A028]" />}
        </button>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#141414] rounded-2xl border border-white/[0.06] overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/[0.06]">
        <div className="w-7 h-7 rounded-lg bg-[#C5A028]/10 border border-[#C5A028]/20 flex items-center justify-center">
          <Icon size={13} className="text-[#C5A028]" />
        </div>
        <h2 className="text-xs font-semibold text-white/40 tracking-widest uppercase">{title}</h2>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-white/50">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-white/25">{hint}</p>}
    </div>
  );
}

const INPUT =
  "w-full px-4 py-3 text-sm rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/80 placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-[#C5A028]/40 focus:border-[#C5A028]/40 transition-all";

export function EventForm({ event }: Props) {
  const { lang } = useLanguage();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Split stored date into date and time parts
  const storedDate = event?.date ? new Date(event.date) : null;
  const defaultDate = storedDate
    ? storedDate.toISOString().slice(0, 10)
    : "";
  const defaultTime = storedDate
    ? storedDate.toTimeString().slice(0, 5)
    : "19:00";

  const [form, setForm] = useState({
    coupleNames: event?.coupleNames ?? "",
    name: event?.name ?? "",
    date: defaultDate,
    time: defaultTime,
    venue: event?.venue ?? "",
    capacity: String(event?.capacity ?? 200),
  });

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (!form.date || !form.time) {
      setError(lang === "ar" ? "يرجى تحديد التاريخ والوقت" : "Please select date and time");
      return;
    }

    // Combine date + time into ISO datetime
    const combinedDate = new Date(`${form.date}T${form.time}:00`).toISOString();

    const payload = {
      name: form.name || form.coupleNames,
      coupleNames: form.coupleNames,
      date: combinedDate,
      venue: form.venue,
      capacity: Number(form.capacity),
    };

    startTransition(async () => {
      try {
        let res: Response;
        if (event) {
          res = await fetch(`/api/events/${event.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        } else {
          res = await fetch("/api/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        }

        if (!res.ok) {
          const data = await res.json() as { error?: string };
          setError(data.error ?? t(lang, "event_save_error"));
          return;
        }

        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 3000);
      } catch {
        setError(t(lang, "event_save_error"));
      }
    });
  }

  const isCreate = !event;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Page header */}

      <div className="mb-6">
        <h1 className="text-lg font-bold text-white/90">{t(lang, "event_page_title")}</h1>
        <p className="text-xs text-white/35 mt-0.5">{t(lang, "event_page_subtitle")}</p>
      </div>

      {/* Share code — shown when event exists */}
      {event && <ShareCode eventId={event.id} lang={lang} />}

      {/* Details */}
      <Section icon={Heart} title={t(lang, "event_section_details")}>
        <Field label={t(lang, "event_couple_names")}>
          <input
            type="text"
            value={form.coupleNames}
            onChange={set("coupleNames")}
            placeholder={t(lang, "event_couple_names_placeholder")}
            required
            className={INPUT}
            dir="auto"
          />
        </Field>
        <Field label={t(lang, "event_name")}>
          <input
            type="text"
            value={form.name}
            onChange={set("name")}
            placeholder={t(lang, "event_name_placeholder")}
            className={INPUT}
            dir="auto"
          />
        </Field>
      </Section>

      {/* Schedule */}
      <Section icon={Calendar} title={t(lang, "event_section_schedule")}>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t(lang, "event_date")}>
            <input
              type="date"
              value={form.date}
              onChange={set("date")}
              required
              className={[INPUT, "cursor-pointer [color-scheme:dark]"].join(" ")}
              dir="ltr"
            />
          </Field>
          <Field label={t(lang, "event_time")}>
            <div className="relative">
              <Clock size={13} className="absolute top-1/2 -translate-y-1/2 start-3.5 text-white/20 pointer-events-none" />
              <input
                type="time"
                value={form.time}
                onChange={set("time")}
                required
                className={[INPUT, "ps-9 [color-scheme:dark]"].join(" ")}
                dir="ltr"
              />
            </div>
          </Field>
        </div>
      </Section>

      {/* Venue */}
      <Section icon={MapPin} title={t(lang, "event_section_venue")}>
        <Field label={t(lang, "event_venue")}>
          <div className="relative">
            <MapPin size={13} className="absolute top-1/2 -translate-y-1/2 start-3.5 text-white/20 pointer-events-none" />
            <input
              type="text"
              value={form.venue}
              onChange={set("venue")}
              placeholder={t(lang, "event_venue_placeholder")}
              required
              className={[INPUT, "ps-9"].join(" ")}
              dir="auto"
            />
          </div>
        </Field>
        <Field label={t(lang, "event_capacity")} hint={t(lang, "event_capacity_hint")}>
          <div className="relative">
            <Users size={13} className="absolute top-1/2 -translate-y-1/2 start-3.5 text-white/20 pointer-events-none" />
            <input
              type="number"
              min={1}
              max={10000}
              value={form.capacity}
              onChange={set("capacity")}
              required
              className={[INPUT, "ps-9"].join(" ")}
              dir="ltr"
            />
          </div>
        </Field>
      </Section>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-sm text-rose-400 text-center">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3.5 rounded-xl font-bold text-sm bg-[#C5A028] hover:bg-[#D4B030] active:scale-[0.98] text-black transition-all duration-200 shadow-lg shadow-[#C5A028]/15 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isPending ? (
          <><Loader2 size={16} className="animate-spin" />{t(lang, "event_saving")}</>
        ) : saved ? (
          <><CheckCircle2 size={16} />{t(lang, "event_saved")}</>
        ) : (
          <><Save size={16} />{isCreate ? t(lang, "event_create") : t(lang, "event_save")}</>
        )}
      </button>
    </form>
  );
}
