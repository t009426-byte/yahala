"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, X, Copy, Check, MessageCircle, Upload, UserCheck } from "lucide-react";
import type { GuestStatus, GuestSide, GuestTier } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GuestRow {
  id: string;
  name: string;
  phone: string;
  side: GuestSide;
  tier: GuestTier;
  tableNumber: number | null;
  status: GuestStatus;
  plusOneAllowed: boolean;
  qrToken: string;
}

interface GuestsResponse {
  data: GuestRow[];
  total: number;
  page: number;
  hasMore: boolean;
}

interface AddGuestForm {
  name: string;
  phone: string;
  side: GuestSide;
  tableNumber: string;
  tier: GuestTier;
  plusOneAllowed: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_PILL: Record<GuestStatus, string> = {
  CONFIRMED: "bg-emerald-50 text-emerald-700",
  PENDING: "bg-amber-50 text-amber-700",
  DECLINED: "bg-rose-50 text-rose-700",
  ENTERED: "bg-violet-50 text-violet-700",
};
const STATUS_LABEL: Record<GuestStatus, string> = {
  CONFIRMED: "مؤكد",
  PENDING: "منتظر",
  DECLINED: "اعتذر",
  ENTERED: "دخل",
};
const TIER_LABEL: Record<GuestTier, string> = {
  GENERAL: "عام",
  VIP: "★ VIP",
  BACKSTAGE: "Backstage",
};
const TABS = [
  { status: "ALL", label: "الكل" },
  { status: "PENDING", label: "منتظر" },
  { status: "CONFIRMED", label: "مؤكد" },
  { status: "DECLINED", label: "اعتذر" },
  { status: "ENTERED", label: "دخل" },
] as const;

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function fetchGuests(
  eventId: string,
  status: string,
  search: string,
  page: number
): Promise<GuestsResponse> {
  const params = new URLSearchParams({
    eventId,
    status,
    page: String(page),
    pageSize: "20",
    ...(search && { search }),
  });
  const res = await fetch(`/api/guests?${params}`);
  if (!res.ok) throw new Error("fetch failed");
  return res.json() as Promise<GuestsResponse>;
}

// ─── Contact parsers ─────────────────────────────────────────────────────────

interface RawContact { name: string; phone: string }

function parseCSV(text: string): RawContact[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  const hasHeader = /name|اسم|phone|رقم|tel/i.test(lines[0]);
  return lines
    .slice(hasHeader ? 1 : 0)
    .map((line) => {
      const parts = line
        .split(",")
        .map((p) => p.trim().replace(/^"|"$/g, ""));
      return { name: parts[0] ?? "", phone: parts[1] ?? "" };
    })
    .filter((c) => c.name && c.phone);
}

function parseVCard(text: string): RawContact[] {
  return text
    .split(/BEGIN:VCARD/i)
    .slice(1)
    .map((card) => {
      const name = card.match(/^FN[^:]*:(.*)/m)?.[1]?.trim() ?? "";
      const phone = card.match(/^TEL[^:\n]*:(.*)/m)?.[1]?.trim() ?? "";
      return { name, phone };
    })
    .filter((c) => c.name && c.phone);
}

// ─── Import Panel ─────────────────────────────────────────────────────────────

function ImportPanel({
  eventId,
  defaultSide,
  onClose,
  onImported,
}: {
  eventId: string;
  defaultSide: GuestSide;
  onClose: () => void;
  onImported: () => void;
}) {
  const [contacts, setContacts] = useState<RawContact[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [side, setSide] = useState<GuestSide>(defaultSide);
  const [loading, setLoading] = useState(false);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);

  const hasContactPicker =
    typeof navigator !== "undefined" && "contacts" in navigator && "ContactsManager" in window;

  function loadContacts(parsed: RawContact[]) {
    setContacts(parsed);
    setSelected(new Set(parsed.map((_, i) => i)));
    setDone(null);
    setError(null);
  }

  async function pickFromPhone() {
    if (!hasContactPicker) return;
    setPicking(true);
    setError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = await (navigator as any).contacts.select(["name", "tel"], { multiple: true });
      const parsed: RawContact[] = (raw as Array<{ name: string[]; tel: string[] }>)
        .flatMap((c) => {
          const name = c.name?.[0]?.trim() ?? "";
          return (c.tel ?? []).map((tel) => ({ name, phone: tel.replace(/\s/g, "") }));
        })
        .filter((c) => c.name && c.phone);
      if (!parsed.length) { setError("لم يتم اختيار أي جهة اتصال"); return; }
      loadContacts(parsed);
    } catch {
      // User cancelled — ignore
    } finally {
      setPicking(false);
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = file.name.endsWith(".vcf") ? parseVCard(text) : parseCSV(text);
      loadContacts(parsed);
    };
    reader.readAsText(file);
  }

  function toggleAll() {
    setSelected(
      selected.size === contacts.length
        ? new Set()
        : new Set(contacts.map((_, i) => i))
    );
  }

  function toggle(i: number) {
    const next = new Set(selected);
    next.has(i) ? next.delete(i) : next.add(i);
    setSelected(next);
  }

  async function submit() {
    if (!selected.size) return;
    setLoading(true);
    setError(null);
    try {
      const guests = [...selected].map((i) => contacts[i]!);
      const res = await fetch("/api/guests/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, side, guests }),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(String(d.error ?? "فشل الاستيراد"));
      }
      const { inserted } = (await res.json()) as { inserted: number };
      setDone(inserted);
      onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 mb-4 animate-fade-in space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
          <Upload size={14} />
          استيراد جهات اتصال
        </h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-muted-foreground transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Pickers */}
      {!contacts.length && (
        <div className="space-y-3">
          {/* Contact Picker API — mobile only */}
          {hasContactPicker && (
            <button
              onClick={pickFromPhone}
              disabled={picking}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-primary-700 text-white font-semibold text-sm hover:bg-primary-800 disabled:opacity-60 transition-colors"
            >
              {picking ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <UserCheck size={16} />
              )}
              {picking ? "جاري الفتح..." : "اختر من جهات الاتصال"}
            </button>
          )}

          {/* File upload */}
          <label className={[
            "flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-200 rounded-xl p-6 cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-all text-center",
            hasContactPicker ? "py-4" : "py-8",
          ].join(" ")}>
            <Upload size={20} className="text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold text-foreground">ارفع ملف جهات الاتصال</p>
              <p className="text-xs text-muted-foreground mt-0.5">CSV أو vCard (.vcf)</p>
            </div>
            <input type="file" accept=".csv,.vcf,text/csv,text/vcard" onChange={handleFile} className="hidden" />
          </label>

          {error && (
            <p className="text-xs text-destructive bg-destructive/5 px-3 py-2 rounded-lg border border-destructive/20 text-center">
              {error}
            </p>
          )}
        </div>
      )}

      {/* Preview */}
      {contacts.length > 0 && done === null && (
        <>
          {/* Side selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-foreground shrink-0">الجانب:</span>
            <div className="flex gap-2">
              {(["BRIDE", "GROOM"] as GuestSide[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSide(s)}
                  className={[
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border",
                    side === s
                      ? s === "BRIDE"
                        ? "bg-pink-500 text-white border-pink-500"
                        : "bg-sky-500 text-white border-sky-500"
                      : "bg-gray-50 text-muted-foreground border-gray-200 hover:border-gray-300",
                  ].join(" ")}
                >
                  {s === "BRIDE" ? "أهل العروس" : "أهل العريس"}
                </button>
              ))}
            </div>
          </div>

          {/* Select-all + count */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selected.size === contacts.length}
                onChange={toggleAll}
                className="w-4 h-4 rounded accent-primary-700"
              />
              <span className="text-xs font-medium text-foreground">تحديد الكل</span>
            </label>
            <span className="text-xs text-muted-foreground">
              {selected.size} / {contacts.length} محدد
            </span>
          </div>

          {/* Contact list */}
          <div className="max-h-56 overflow-y-auto rounded-xl border border-gray-100 divide-y divide-gray-50">
            {contacts.map((c, i) => (
              <label key={i} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.has(i)}
                  onChange={() => toggle(i)}
                  className="w-4 h-4 rounded accent-primary-700 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground font-mono" dir="ltr">{c.phone}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Change file */}
          <label className="text-xs text-primary-700 underline underline-offset-2 cursor-pointer hover:text-primary-800">
            تغيير الملف
            <input type="file" accept=".csv,.vcf,text/csv,text/vcard" onChange={handleFile} className="hidden" />
          </label>

          {error && (
            <p className="text-xs text-destructive bg-destructive/5 px-3 py-2 rounded-lg border border-destructive/20">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={loading || !selected.size}
              className="flex-1 py-2.5 rounded-xl bg-primary-700 text-white font-semibold text-sm hover:bg-primary-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <UserCheck size={14} />
              )}
              {loading ? "جاري الاستيراد..." : `استيراد ${selected.size} جهة اتصال`}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-gray-100 text-muted-foreground font-semibold text-sm hover:bg-gray-200 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </>
      )}

      {/* Success */}
      {done !== null && (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
            <UserCheck size={22} className="text-emerald-600" />
          </div>
          <div>
            <p className="font-bold text-foreground">تم الاستيراد بنجاح</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              تمت إضافة {done} جهة اتصال
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-primary-700 text-white text-sm font-semibold hover:bg-primary-800 transition-colors"
          >
            إغلاق
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Add Guest Form ───────────────────────────────────────────────────────────

function AddGuestPanel({
  eventId,
  defaultSide,
  onClose,
  onAdded,
}: {
  eventId: string;
  defaultSide: GuestSide;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [form, setForm] = useState<AddGuestForm>({
    name: "",
    phone: "",
    side: defaultSide,
    tableNumber: "",
    tier: "GENERAL",
    plusOneAllowed: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof AddGuestForm>(key: K, value: AddGuestForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          name: form.name.trim(),
          phone: form.phone.replace(/[\s\-\(\)]/g, ""),
          side: form.side,
          tableNumber: form.tableNumber ? Number(form.tableNumber) : undefined,
          tier: form.tier,
          plusOneAllowed: form.plusOneAllowed,
        }),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? "فشل الحفظ");
      }
      onAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 mb-4 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
          <Plus size={14} />
          إضافة مدعو جديد
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-gray-100 text-muted-foreground transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-foreground">الاسم *</label>
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="الاسم الكامل"
              className="w-full px-3 py-2.5 rounded-xl border border-input text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-foreground">رقم الهاتف *</label>
            <input
              required
              type="tel"
              dir="ltr"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+96512345678"
              className="w-full px-3 py-2.5 rounded-xl border border-input text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-foreground">الجانب</label>
            <select
              value={form.side}
              onChange={(e) => set("side", e.target.value as GuestSide)}
              className="w-full px-3 py-2.5 rounded-xl border border-input text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              <option value="BRIDE">أهل العروس</option>
              <option value="GROOM">أهل العريس</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-foreground">رقم الطاولة</label>
            <input
              type="number"
              min="1"
              value={form.tableNumber}
              onChange={(e) => set("tableNumber", e.target.value)}
              placeholder="—"
              className="w-full px-3 py-2.5 rounded-xl border border-input text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-foreground">المستوى</label>
            <select
              value={form.tier}
              onChange={(e) => set("tier", e.target.value as GuestTier)}
              className="w-full px-3 py-2.5 rounded-xl border border-input text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              <option value="GENERAL">عام</option>
              <option value="VIP">VIP</option>
              <option value="BACKSTAGE">Backstage</option>
            </select>
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.plusOneAllowed}
            onChange={(e) => set("plusOneAllowed", e.target.checked)}
            className="w-4 h-4 rounded border-input accent-primary-700"
          />
          <span className="text-sm text-foreground">السماح بإحضار ضيف إضافي (+1)</span>
        </label>

        {error && (
          <p className="text-xs text-destructive bg-destructive/5 px-3 py-2 rounded-lg border border-destructive/20">
            {error}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-primary-700 text-white font-semibold text-sm hover:bg-primary-800 disabled:opacity-60 transition-colors"
          >
            {loading ? "جاري الحفظ..." : "حفظ المدعو"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-gray-100 text-muted-foreground font-semibold text-sm hover:bg-gray-200 transition-colors"
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Guest row ────────────────────────────────────────────────────────────────

function GuestManageRow({ guest }: { guest: GuestRow }) {
  const [copied, setCopied] = useState(false);
  const isBride = guest.side === "BRIDE";

  const initials = guest.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("");

  const maskedPhone = guest.phone.replace(/(\d{4})\d+(\d{4})/, "$1****$2");

  function getRsvpUrl() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/rsvp/${guest.qrToken}`;
  }

  function copyLink() {
    navigator.clipboard.writeText(getRsvpUrl()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function openWhatsApp() {
    const url = getRsvpUrl();
    const msg = `أهلاً ${guest.name} 🌸\nيسعدنا دعوتك، يرجى تأكيد حضورك عبر الرابط:\n${url}`;
    const phone = guest.phone.replace(/\D/g, "");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
      {/* Avatar */}
      <div
        className={[
          "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 select-none",
          isBride ? "bg-pink-100 text-pink-700" : "bg-sky-100 text-sky-700",
        ].join(" ")}
      >
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="font-semibold text-sm text-foreground truncate leading-tight">
            {guest.name}
          </p>
          {guest.tier !== "GENERAL" && (
            <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1 py-0.5 rounded border border-amber-200">
              {TIER_LABEL[guest.tier]}
            </span>
          )}
          {guest.plusOneAllowed && (
            <span className="text-[9px] font-medium text-blue-600 bg-blue-50 px-1 py-0.5 rounded border border-blue-100">
              +1
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground font-mono" dir="ltr">
            {maskedPhone}
          </span>
          {guest.tableNumber && (
            <span className="text-[10px] text-muted-foreground">
              طاولة {guest.tableNumber}
            </span>
          )}
        </div>
      </div>

      {/* Status */}
      <span
        className={[
          "text-[10px] font-semibold px-2 py-1 rounded-full shrink-0",
          STATUS_PILL[guest.status],
        ].join(" ")}
      >
        {STATUS_LABEL[guest.status]}
      </span>

      {/* Share buttons */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={copyLink}
          title="نسخ رابط الدعوة"
          className="w-7 h-7 rounded-lg flex items-center justify-center bg-gray-100 text-muted-foreground hover:bg-gray-200 transition-colors"
        >
          {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
        </button>
        <button
          onClick={openWhatsApp}
          title="إرسال الدعوة عبر واتساب"
          className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
        >
          <MessageCircle size={12} />
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function GuestsManage({
  eventId,
  canAdd,
  defaultSide,
}: {
  eventId: string;
  canAdd: boolean;
  defaultSide: GuestSide;
}) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [activeStatus, setActiveStatus] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["guests-manage", eventId, activeStatus, search, page],
    queryFn: () => fetchGuests(eventId, activeStatus, search, page),
    placeholderData: (prev) => prev,
  });

  function handleTabChange(status: string) {
    setActiveStatus(status);
    setPage(1);
  }

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["guests-manage", eventId] });
  }

  return (
    <div className="p-4 md:p-6 space-y-4 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <span>👥</span> إدارة المدعوين
          </h1>
          {data && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {data.total.toLocaleString("ar-KW")} مدعو
            </p>
          )}
        </div>
        {canAdd && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowImport((v) => !v); setShowForm(false); }}
              className={[
                "flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all",
                showImport
                  ? "bg-gray-100 text-muted-foreground"
                  : "bg-white border border-gray-200 text-foreground hover:bg-gray-50 shadow-sm",
              ].join(" ")}
            >
              <Upload size={14} />
              استيراد
            </button>
            <button
              onClick={() => { setShowForm((v) => !v); setShowImport(false); }}
              className={[
                "flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all",
                showForm
                  ? "bg-gray-100 text-muted-foreground"
                  : "bg-primary-700 text-white hover:bg-primary-800 shadow-sm",
              ].join(" ")}
            >
              {showForm ? <X size={14} /> : <Plus size={14} />}
              {showForm ? "إلغاء" : "إضافة مدعو"}
            </button>
          </div>
        )}
      </div>

      {/* Import panel */}
      {showImport && (
        <ImportPanel
          eventId={eventId}
          defaultSide={defaultSide}
          onClose={() => setShowImport(false)}
          onImported={invalidate}
        />
      )}

      {/* Add guest form */}
      {showForm && (
        <AddGuestPanel
          eventId={eventId}
          defaultSide={defaultSide}
          onClose={() => setShowForm(false)}
          onAdded={invalidate}
        />
      )}

      {/* Guest list card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-100 space-y-3">
          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map(({ status, label }) => (
              <button
                key={status}
                onClick={() => handleTabChange(status)}
                className={[
                  "px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all",
                  activeStatus === status
                    ? "bg-primary-700 text-white shadow-sm"
                    : "bg-gray-100 text-muted-foreground hover:bg-gray-200",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              size={14}
              className="absolute top-1/2 -translate-y-1/2 end-3 text-muted-foreground pointer-events-none"
            />
            <input
              type="search"
              placeholder="بحث بالاسم..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pe-9 ps-3 py-2 text-sm rounded-xl border border-input bg-gray-50 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all"
            />
          </div>
        </div>

        {/* List */}
        <div className="divide-y divide-gray-50">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-32 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="h-5 w-12 bg-gray-100 rounded-full animate-pulse" />
              </div>
            ))
          ) : isError ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              تعذّر تحميل المدعوين
            </div>
          ) : !data?.data.length ? (
            <div className="py-16 text-center space-y-2">
              <p className="text-4xl">👥</p>
              <p className="text-sm text-muted-foreground">
                {search ? "لا توجد نتائج" : "لا يوجد مدعوون بعد"}
              </p>
              {!search && canAdd && (
                <button
                  onClick={() => setShowForm(true)}
                  className="text-sm text-primary-700 underline underline-offset-2"
                >
                  أضف أول مدعو
                </button>
              )}
            </div>
          ) : (
            data.data.map((guest) => (
              <GuestManageRow key={guest.id} guest={guest} />
            ))
          )}
        </div>

        {/* Pagination */}
        {data && (data.hasMore || page > 1) && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-xs font-medium text-primary-700 disabled:text-muted-foreground disabled:cursor-not-allowed hover:underline"
            >
              ← السابق
            </button>
            <span className="text-xs text-muted-foreground tabular-nums">صفحة {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!data.hasMore}
              className="text-xs font-medium text-primary-700 disabled:text-muted-foreground disabled:cursor-not-allowed hover:underline"
            >
              التالي →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
