"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Copy, Check, RefreshCw, Trash2, Plus, ArrowRight,
  Users, Gift, Key, FileText, Tag, ToggleLeft, ToggleRight, Loader2
} from "lucide-react";
import Link from "next/link";
import type { DiscountType } from "@/types";

interface User { id: string; name: string | null; email: string | null; role: string; label: string | null; createdAt: string }
interface Voucher {
  id: string; code: string; label: string | null; discountType: DiscountType;
  amount: string | null; percentage: number | null; maxUses: number; usedCount: number;
  isActive: boolean; expiresAt: string | null;
}
interface Event {
  id: string; coupleNames: string; name: string; date: string; venue: string;
  capacity: number; invitationText: string | null;
  organizerCode: string | null; brideCode: string | null; groomCode: string | null; gateCode: string | null;
  users: User[]; vouchers: Voucher[];
  _count: { guests: number; gifts: number };
}

const CARD = "rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4";
const INPUT = "w-full px-3.5 py-2.5 rounded-xl text-sm outline-none border border-white/[0.08] bg-white/[0.04] text-white/80 placeholder:text-white/20 focus:border-[#C5A028]/50";
const LABEL = "block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1";
const BTN = "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all";

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  ORGANIZER: "bg-[#C5A028]/15 text-[#C5A028] border-[#C5A028]/20",
  COUPLE: "bg-pink-500/15 text-pink-400 border-pink-500/20",
  BRIDE_FAMILY: "bg-rose-500/15 text-rose-400 border-rose-500/20",
  GROOM_FAMILY: "bg-sky-500/15 text-sky-400 border-sky-500/20",
  GATE_STAFF: "bg-amber-500/15 text-amber-400 border-amber-500/20",
};

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  function doCopy() {
    void navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={doCopy} className="p-1.5 rounded-lg hover:bg-white/[0.08] transition-colors text-white/30 hover:text-white/70">
      {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
    </button>
  );
}

function CodeRow({ label, code, color }: { label: string; code: string | null; color: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={`text-[11px] font-bold px-2 py-1 rounded-lg border ${color}`}>{label}</span>
      {code ? (
        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className="font-mono text-sm font-bold text-white/80 tracking-[0.15em]">{code}</span>
          <CopyButton value={code} />
        </div>
      ) : (
        <span className="text-xs text-white/25 italic">not generated</span>
      )}
    </div>
  );
}

function InviteCodesSection({ event, onRefresh }: { event: Event; onRefresh: () => void }) {
  const [regen, startRegen] = useTransition();

  function regenerate() {
    startRegen(async () => {
      await fetch(`/api/admin/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerateCodes: true }),
      });
      onRefresh();
    });
  }

  return (
    <div className={CARD}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-[#C5A028] uppercase tracking-widest flex items-center gap-1.5">
          <Key size={12} /> Invite Codes
        </p>
        <button
          onClick={regenerate}
          disabled={regen}
          className={`${BTN} border border-white/[0.08] bg-white/[0.04] text-white/50 hover:text-white/80 hover:border-white/[0.15]`}
        >
          {regen ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          Regenerate
        </button>
      </div>

      <div className="space-y-3">
        <CodeRow label="Organizer" code={event.organizerCode} color="bg-[#C5A028]/15 text-[#C5A028] border-[#C5A028]/20" />
        <CodeRow label="Bride Family" code={event.brideCode} color="bg-rose-500/15 text-rose-400 border-rose-500/20" />
        <CodeRow label="Groom Family" code={event.groomCode} color="bg-sky-500/15 text-sky-400 border-sky-500/20" />
        <CodeRow label="Gate Staff" code={event.gateCode} color="bg-amber-500/15 text-amber-400 border-amber-500/20" />
      </div>

      {event.brideCode && (
        <div className="pt-2 border-t border-white/[0.04]">
          <p className="text-[11px] text-white/25">Share these codes with the respective groups. Each code grants the corresponding role access to the dashboard.</p>
        </div>
      )}
    </div>
  );
}

function InvitationTextSection({ event, onRefresh }: { event: Event; onRefresh: () => void }) {
  const [text, setText] = useState(event.invitationText ?? "");
  const [saving, startSave] = useTransition();
  const [saved, setSaved] = useState(false);

  function save() {
    startSave(async () => {
      await fetch(`/api/admin/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationText: text }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onRefresh();
    });
  }

  return (
    <div className={CARD}>
      <p className="text-xs font-bold text-[#C5A028] uppercase tracking-widest flex items-center gap-1.5">
        <FileText size={12} /> Invitation Message
      </p>
      <p className="text-xs text-white/30">Shown on guests' digital QR pass cards</p>
      <textarea
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="نسعد بدعوتكم لحضور حفل زفاف..."
        className={[INPUT, "resize-none leading-relaxed"].join(" ")}
        dir="auto"
        maxLength={2000}
      />
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-white/20">{text.length}/2000</span>
        <button
          onClick={save}
          disabled={saving}
          className={`${BTN} bg-[#C5A028] text-black hover:bg-[#D4B030] disabled:opacity-50`}
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : saved ? <Check size={12} /> : null}
          {saved ? "Saved!" : saving ? "Saving..." : "Save Message"}
        </button>
      </div>
    </div>
  );
}

function VouchersSection({ event, onRefresh }: { event: Event; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: "", label: "", discountType: "FIXED" as DiscountType, amount: "", percentage: "" });
  const [creating, startCreate] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [toggling, startToggle] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  function setF(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));
  }

  function createVoucher(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    startCreate(async () => {
      const payload: Record<string, unknown> = {
        eventId: event.id,
        code: form.code,
        label: form.label || undefined,
        discountType: form.discountType,
        maxUses: 1,
      };
      if (form.discountType === "FIXED") payload.amount = Number(form.amount);
      if (form.discountType === "PERCENTAGE") payload.percentage = Number(form.percentage);

      const res = await fetch("/api/admin/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { setFormError("Code already exists or invalid data"); return; }
      setForm({ code: "", label: "", discountType: "FIXED", amount: "", percentage: "" });
      setShowForm(false);
      onRefresh();
    });
  }

  function deleteVoucher(id: string) {
    startDelete(async () => {
      await fetch(`/api/admin/vouchers/${id}`, { method: "DELETE" });
      onRefresh();
    });
  }

  function toggleVoucher(id: string, isActive: boolean) {
    startToggle(async () => {
      await fetch(`/api/admin/vouchers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      onRefresh();
    });
  }

  function discountLabel(v: Voucher) {
    if (v.discountType === "FREE") return "100% Free";
    if (v.discountType === "PERCENTAGE") return `${v.percentage}% off`;
    return `KD ${Number(v.amount).toFixed(3)} off`;
  }

  return (
    <div className={CARD}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-[#C5A028] uppercase tracking-widest flex items-center gap-1.5">
          <Tag size={12} /> Vouchers & Discounts
        </p>
        <button
          onClick={() => setShowForm((s) => !s)}
          className={`${BTN} border border-white/[0.08] bg-white/[0.04] text-white/60 hover:text-white hover:border-white/[0.15]`}
        >
          <Plus size={12} /> Add Voucher
        </button>
      </div>

      {showForm && (
        <form onSubmit={createVoucher} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 space-y-3">
          <p className="text-xs font-bold text-white/50">New Voucher</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Code *</label>
              <input type="text" value={form.code} onChange={setF("code")} required
                placeholder="GIFT20" maxLength={20} className={INPUT}
                style={{ fontFamily: "monospace", textTransform: "uppercase" }}
              />
            </div>
            <div>
              <label className={LABEL}>Type *</label>
              <select value={form.discountType} onChange={setF("discountType")} className={INPUT}>
                <option value="FIXED">Fixed Amount (KD)</option>
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FREE">Free (100%)</option>
              </select>
            </div>
          </div>
          <div>
            <label className={LABEL}>Label (optional)</label>
            <input type="text" value={form.label} onChange={setF("label")}
              placeholder="e.g. 20% off gift — Sponsored by X" className={INPUT} />
          </div>
          {form.discountType === "FIXED" && (
            <div>
              <label className={LABEL}>Amount (KWD) *</label>
              <input type="number" value={form.amount} onChange={setF("amount")} min="0.1" step="0.5" required className={INPUT} />
            </div>
          )}
          {form.discountType === "PERCENTAGE" && (
            <div>
              <label className={LABEL}>Percentage (%) *</label>
              <input type="number" value={form.percentage} onChange={setF("percentage")} min="1" max="100" required className={INPUT} />
            </div>
          )}
          {formError && <p className="text-xs text-rose-400">{formError}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={creating}
              className={`${BTN} bg-[#C5A028] text-black flex-1 justify-center`}>
              {creating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
              {creating ? "Creating..." : "Create Voucher"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className={`${BTN} border border-white/[0.08] text-white/40 hover:text-white/70`}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {event.vouchers.length === 0 ? (
        <p className="text-xs text-white/25 text-center py-4">No vouchers yet. Add one to let guests use discount codes when sending gifts.</p>
      ) : (
        <div className="space-y-2">
          {event.vouchers.map((v) => (
            <div key={v.id}
              className="flex items-center gap-3 px-3.5 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02]"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm font-bold text-white/80 tracking-widest">{v.code}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#C5A028]/15 text-[#C5A028]">
                    {discountLabel(v)}
                  </span>
                  {!v.isActive && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/[0.05] text-white/30">
                      Inactive
                    </span>
                  )}
                </div>
                {v.label && <p className="text-xs text-white/35 mt-0.5 truncate">{v.label}</p>}
                <p className="text-[11px] text-white/25 mt-0.5">
                  Used {v.usedCount}/{v.maxUses} times
                </p>
              </div>
              <div className="flex items-center gap-1 flex-none">
                <button onClick={() => toggleVoucher(v.id, v.isActive)} disabled={toggling}
                  className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-colors" title="Toggle">
                  {v.isActive ? <ToggleRight size={16} className="text-green-400" /> : <ToggleLeft size={16} />}
                </button>
                <button onClick={() => deleteVoucher(v.id)} disabled={deleting}
                  className="p-1.5 rounded-lg hover:bg-rose-500/10 text-white/20 hover:text-rose-400 transition-colors" title="Delete">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UsersSection({ users }: { users: User[] }) {
  return (
    <div className={CARD}>
      <p className="text-xs font-bold text-[#C5A028] uppercase tracking-widest flex items-center gap-1.5">
        <Users size={12} /> Team Members ({users.length})
      </p>
      {users.length === 0 ? (
        <p className="text-xs text-white/25 text-center py-4">No users have joined yet. Share invite codes to get started.</p>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-xs font-bold text-white/50 flex-none">
                {(u.name ?? u.email ?? "?")[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white/80 truncate">{u.name ?? u.email ?? "Unknown"}</p>
                {u.label && <p className="text-xs text-white/35 truncate">{u.label}</p>}
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ROLE_COLORS[u.role] ?? "bg-white/[0.06] text-white/40 border-white/[0.08]"}`}>
                {u.role.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function EventAdminView({ event: initialEvent }: { event: Event }) {
  const router = useRouter();
  const [event, setEvent] = useState(initialEvent);
  const [deleting, startDelete] = useTransition();
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  async function refresh() {
    const res = await fetch(`/api/admin/events/${event.id}`);
    if (res.ok) {
      const { data } = await res.json() as { data: Event };
      setEvent(data);
    }
  }

  function deleteEvent() {
    startDelete(async () => {
      await fetch(`/api/admin/events/${event.id}`, { method: "DELETE" });
      router.push("/admin/events");
      router.refresh();
    });
  }

  const dateStr = new Date(event.date).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/admin/events" className="text-white/30 hover:text-white/60 transition-colors mt-1">
          <ArrowRight size={16} className="rotate-180" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-white truncate">{event.coupleNames}</h1>
          <p className="text-sm text-white/40 mt-0.5">{dateStr} · {event.venue}</p>
        </div>
        <div className="flex items-center gap-4 flex-none text-center">
          <div>
            <p className="text-lg font-bold text-white/80">{event._count.guests}</p>
            <p className="text-[10px] text-white/30">guests</p>
          </div>
          <div>
            <p className="text-lg font-bold text-white/80">{event._count.gifts}</p>
            <p className="text-[10px] text-white/30">gifts</p>
          </div>
        </div>
      </div>

      {/* Sections */}
      <InviteCodesSection event={event} onRefresh={refresh} />
      <InvitationTextSection event={event} onRefresh={refresh} />
      <VouchersSection event={event} onRefresh={refresh} />
      <UsersSection users={event.users} />

      {/* Danger zone */}
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5 space-y-3">
        <p className="text-xs font-bold text-rose-400 uppercase tracking-widest">Danger Zone</p>
        {!deleteConfirm ? (
          <button
            onClick={() => setDeleteConfirm(true)}
            className={`${BTN} border border-rose-500/30 text-rose-400 hover:bg-rose-500/10`}
          >
            <Trash2 size={12} /> Delete Event
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-rose-300">This will permanently delete the event and all guests, gifts, and vouchers. This cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={deleteEvent} disabled={deleting}
                className={`${BTN} bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50`}>
                {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                {deleting ? "Deleting..." : "Yes, Delete Everything"}
              </button>
              <button onClick={() => setDeleteConfirm(false)}
                className={`${BTN} border border-white/[0.08] text-white/40 hover:text-white/70`}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
