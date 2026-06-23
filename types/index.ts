import type { Prisma } from "@prisma/client";

// ─────────────────────────────────────────────
// Re-exported Prisma enums (keep in sync with schema.prisma)
// ─────────────────────────────────────────────

export type GuestSide = "BRIDE" | "GROOM";
export type GuestTier = "GENERAL" | "VIP" | "BACKSTAGE";
export type GuestStatus = "PENDING" | "CONFIRMED" | "DECLINED" | "ENTERED";
export type GiftStatus = "PENDING" | "PAID" | "FAILED";
export type DiscountType = "FIXED" | "PERCENTAGE" | "FREE";
export type UserRole =
  | "ADMIN"
  | "ORGANIZER"
  | "COUPLE"
  | "BRIDE_FAMILY"
  | "GROOM_FAMILY"
  | "GATE_STAFF";

// ─────────────────────────────────────────────
// Rich model types (Prisma includes / selects)
// ─────────────────────────────────────────────

export type EventWithCounts = Prisma.EventGetPayload<{
  include: {
    _count: { select: { guests: true; gifts: true } };
  };
}>;

export type GuestWithRelations = Prisma.GuestGetPayload<{
  include: {
    invitedBy: { select: { id: true; name: true } };
    invitees: { select: { id: true; name: true; status: true } };
    gifts: true;
    event: { select: { id: true; name: true; date: true; coupleNames: true } };
  };
}>;

export type GiftWithGuest = Prisma.GiftGetPayload<{
  include: {
    guest: { select: { id: true; name: true; side: true; phone: true } };
  };
}>;

export type InviteChainWithRelations = Prisma.InviteChainGetPayload<{
  include: {
    inviter: { select: { id: true; name: true } };
    invitee: { select: { id: true; name: true } };
  };
}>;

// ─────────────────────────────────────────────
// API request / response shapes
// ─────────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ─────────────────────────────────────────────
// Event
// ─────────────────────────────────────────────

export interface CreateEventInput {
  name: string;
  date: string; // ISO string
  venue: string;
  capacity: number;
  coupleNames: string;
  bridePhone: string;
  groomPhone: string;
  chainDepthLimit?: number;
  chainBranchWidth?: number;
}

export interface UpdateEventInput extends Partial<CreateEventInput> {}

// ─────────────────────────────────────────────
// Guest
// ─────────────────────────────────────────────

export interface CreateGuestInput {
  eventId: string;
  name: string;
  phone: string;
  side: GuestSide;
  tableNumber?: number;
  tier?: GuestTier;
  plusOneAllowed?: boolean;
  invitedById?: string;
}

export interface UpdateGuestInput {
  name?: string;
  phone?: string;
  side?: GuestSide;
  tableNumber?: number;
  tier?: GuestTier;
  plusOneAllowed?: boolean;
  plusOneName?: string;
  status?: GuestStatus;
}

export interface RSVPInput {
  token: string;
  plusOneName?: string;
  giftAmount?: number;
  giftMessage?: string;
  paymentMethod?: "CARD" | "KNET" | "CASH";
}

// ─────────────────────────────────────────────
// Gift
// ─────────────────────────────────────────────

export interface CreateGiftInput {
  eventId: string;
  guestId: string;
  amount: number;
  currency?: string;
  message?: string;
  paymentMethod: "CARD" | "KNET" | "CASH";
}

export interface UpdateGiftInput {
  status?: GiftStatus;
  paymentRef?: string;
}

// ─────────────────────────────────────────────
// Gate / entry
// ─────────────────────────────────────────────

export interface ScanQRInput {
  qrToken: string;
  eventId: string;
  scannedById?: string;
}

export type ScanResult =
  | { ok: true; guest: GuestWithRelations }
  | { ok: false; reason: "NOT_FOUND" | "ALREADY_ENTERED" | "DECLINED" | "CAPACITY_EXCEEDED" };

// ─────────────────────────────────────────────
// Dashboard stats
// ─────────────────────────────────────────────

export interface EventStats {
  invited: number;
  confirmed: number;
  pending: number;
  declined: number;
  entered: number;
  brideConfirmed: number;
  groomConfirmed: number;
  brideTotal: number;
  groomTotal: number;
  giftTotalKwd: number;
  giftBrideKwd: number;
  giftGroomKwd: number;
  capacityPercent: number;
}

// ─────────────────────────────────────────────
// WhatsApp
// ─────────────────────────────────────────────

export type WhatsAppTemplateKey =
  | "invitation_template"
  | "pass_template"
  | "reminder_template"
  | "thankyou_template"
  | "chain_invite_template";

export interface WhatsAppIncomingMessage {
  from: string; // phone number
  text: string;
  messageId: string;
  timestamp: number;
}

export interface WhatsAppOutgoingMessage {
  to: string;
  templateKey: WhatsAppTemplateKey;
  parameters: Record<string, string>;
}

// ─────────────────────────────────────────────
// QR token payload (signed JWT claims)
// ─────────────────────────────────────────────

export interface QRTokenPayload {
  guestId: string;
  eventId: string;
  qrToken: string;
  iat: number;
  exp: number;
}

// ─────────────────────────────────────────────
// Invitation page data (public, token-gated)
// ─────────────────────────────────────────────

export interface InvitationData {
  guestId: string;
  guestName: string;
  guestSide: GuestSide;
  guestTier: GuestTier;
  guestStatus: GuestStatus;
  tableNumber: number | null;
  plusOneAllowed: boolean;
  coupleNames: string;
  eventName: string;
  eventDate: string; // ISO string
  eventVenue: string;
  invitedByName: string | null;
}

// ─────────────────────────────────────────────
// RSVP wizard steps
// ─────────────────────────────────────────────

export type RSVPStep =
  | "plus_one"
  | "gift_amount"
  | "gift_message"
  | "payment_method"
  | "confirmation";

export interface RSVPState {
  token: string;
  invitation: InvitationData;
  step: RSVPStep;
  plusOneName: string;
  giftAmount: number | null;
  giftMessage: string;
  paymentMethod: "CARD" | "KNET" | "CASH" | null;
  qrDataUrl: string | null;
  isSubmitting: boolean;
  error: string | null;
}

// ─────────────────────────────────────────────
// Payment
// ─────────────────────────────────────────────

export interface PaymentInitResult {
  paymentUrl: string;
  paymentRef: string;
  provider: "STRIPE" | "MYFATOORAH";
}

export interface PaymentCallbackResult {
  success: boolean;
  paymentRef: string;
  amount: number;
  currency: string;
}

// ─────────────────────────────────────────────
// Chain invitation
// ─────────────────────────────────────────────

export interface ChainInviteInput {
  inviterGuestId: string;
  inviteePhone: string;
  inviteeName: string;
}

export interface ChainPath {
  depth: number;
  path: Array<{ id: string; name: string }>;
}

// ─────────────────────────────────────────────
// Offline / IndexedDB (gate app)
// ─────────────────────────────────────────────

export interface CachedGuest {
  id: string;
  name: string;
  phone: string;
  side: GuestSide;
  tier: GuestTier;
  tableNumber: number | null;
  qrToken: string;
  status: GuestStatus;
  plusOneName: string | null;
  cachedAt: number;
}

export interface PendingEntrySync {
  guestId: string;
  enteredAt: string;
  syncedAt?: string;
}

// ─────────────────────────────────────────────
// Utility helpers
// ─────────────────────────────────────────────

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncFn<T> = () => Promise<T>;

export const GIFT_PRESETS_KWD = [20, 50, 100, 200] as const;
export type GiftPreset = (typeof GIFT_PRESETS_KWD)[number];

export const SIDE_LABELS: Record<GuestSide, string> = {
  BRIDE: "Bride's Side",
  GROOM: "Groom's Side",
};

export const TIER_LABELS: Record<GuestTier, string> = {
  GENERAL: "General",
  VIP: "VIP",
  BACKSTAGE: "Backstage",
};

export const STATUS_LABELS: Record<GuestStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  DECLINED: "Declined",
  ENTERED: "Entered",
};
