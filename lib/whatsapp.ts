import type { WhatsAppTemplateKey } from "@/types";

const WHATSAPP_API_BASE = "https://graph.facebook.com/v19.0";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const API_TOKEN = process.env.WHATSAPP_API_TOKEN!;

// ─── Template parameter maps ──────────────────────────────────────────────────

interface TemplateParams {
  invitation_template: {
    name: string;
    event: string;
    date: string;
    venue: string;
    table: string;
    link: string;
  };
  pass_template: {
    name: string;
    table: string;
    side: string;
    qr_image_url: string;
  };
  reminder_template: {
    name: string;
    event: string;
    days_until: string;
  };
  thankyou_template: {
    name: string;
    couple_names: string;
    gift_amount?: string;
  };
  chain_invite_template: {
    name: string;
    inviter_name: string;
    event: string;
    date: string;
    link: string;
  };
}

// ─── Low-level send function ──────────────────────────────────────────────────

async function sendWhatsAppRequest(body: Record<string, unknown>): Promise<void> {
  const res = await fetch(
    `${WHATSAPP_API_BASE}/${PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WhatsApp API error ${res.status}: ${err}`);
  }
}

// ─── Template sender ─────────────────────────────────────────────────────────

/**
 * Sends a WhatsApp template message.
 * Template components are built from the params object in the order the
 * template expects — keep in sync with approved Meta templates.
 */
export async function sendTemplate<K extends WhatsAppTemplateKey>(
  to: string,
  templateKey: K,
  params: TemplateParams[K]
): Promise<void> {
  const components = buildComponents(templateKey, params as Record<string, string>);

  await sendWhatsAppRequest({
    messaging_product: "whatsapp",
    to: normalizePhone(to),
    type: "template",
    template: {
      name: templateKey,
      language: { code: "ar" },
      components,
    },
  });
}

function buildComponents(
  _templateKey: string,
  params: Record<string, string>
): unknown[] {
  const parameters = Object.values(params).map((value) => ({
    type: "text",
    text: value,
  }));

  return [{ type: "body", parameters }];
}

// ─── Convenience wrappers ─────────────────────────────────────────────────────

export async function sendInvitation(
  phone: string,
  params: TemplateParams["invitation_template"]
): Promise<void> {
  return sendTemplate(phone, "invitation_template", params);
}

export async function sendPass(
  phone: string,
  params: TemplateParams["pass_template"]
): Promise<void> {
  return sendTemplate(phone, "pass_template", params);
}

export async function sendReminder(
  phone: string,
  params: TemplateParams["reminder_template"]
): Promise<void> {
  return sendTemplate(phone, "reminder_template", params);
}

export async function sendThankYou(
  phone: string,
  params: TemplateParams["thankyou_template"]
): Promise<void> {
  return sendTemplate(phone, "thankyou_template", params);
}

export async function sendChainInvite(
  phone: string,
  params: TemplateParams["chain_invite_template"]
): Promise<void> {
  return sendTemplate(phone, "chain_invite_template", params);
}

// ─── Free-form text (for interactive flows) ───────────────────────────────────

export async function sendText(to: string, text: string): Promise<void> {
  await sendWhatsAppRequest({
    messaging_product: "whatsapp",
    to: normalizePhone(to),
    type: "text",
    text: { body: text },
  });
}

// ─── Webhook verification ─────────────────────────────────────────────────────

export function verifyWebhook(
  mode: string,
  token: string,
  challenge: string
): string | null {
  if (
    mode === "subscribe" &&
    token === process.env.WHATSAPP_VERIFY_TOKEN
  ) {
    return challenge;
  }
  return null;
}

// ─── Incoming message parsing ─────────────────────────────────────────────────

export interface ParsedIncoming {
  from: string;
  text: string;
  messageId: string;
  timestamp: number;
}

export function parseIncomingMessage(
  body: Record<string, unknown>
): ParsedIncoming | null {
  try {
    const entry = (body.entry as Record<string, unknown>[])?.[0];
    const change = (entry?.changes as Record<string, unknown>[])?.[0];
    const value = change?.value as Record<string, unknown>;
    const messages = value?.messages as Record<string, unknown>[];

    if (!messages?.length) return null;

    const message = messages[0];
    const textObj = message.text as Record<string, string> | undefined;

    return {
      from: message.from as string,
      text: (textObj?.body ?? "").trim().toUpperCase(),
      messageId: message.id as string,
      timestamp: Number(message.timestamp),
    };
  } catch {
    return null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizePhone(phone: string): string {
  // Strip spaces, dashes, plus; ensure starts with country code
  return phone.replace(/[\s\-\(\)]/g, "").replace(/^\+/, "");
}
