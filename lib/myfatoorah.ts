// MyFatoorah API client
// Switch PAYMENT_ENV=production in .env.local to use the live gateway

const BASE_URL =
  process.env.PAYMENT_ENV === "production"
    ? "https://api.myfatoorah.com"
    : "https://apitest.myfatoorah.com";
const SECRET_KEY = process.env.PAYMENT_SECRET_KEY ?? "";

function headers() {
  return {
    Authorization: `Bearer ${SECRET_KEY}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { IsSuccess: boolean; Data: T; Message?: string; ValidationErrors?: unknown[] };
  if (!json.IsSuccess) {
    throw new Error(json.Message ?? "MyFatoorah error");
  }
  return json.Data;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaymentMethod {
  PaymentMethodId: number;
  PaymentMethodAr: string;
  PaymentMethodEn: string;
  PaymentMethodCode: string;
  ServiceCharge: number;
  TotalAmount: number;
}

export interface InitiatePaymentData {
  PaymentMethods: PaymentMethod[];
}

export interface ExecutePaymentData {
  InvoiceId: number;
  PaymentURL: string;
  CustomerReference: string;
}

export interface InvoiceData {
  InvoiceStatus: "Paid" | "Unpaid" | "Failed" | "Expired";
  InvoiceValue: number;
  CustomerReference: string;
  InvoiceId: number;
  InvoiceTransactions: Array<{
    TransactionStatus: string;
    PaymentGateway: string;
    ReferenceId: string;
  }>;
}

// ─── API calls ────────────────────────────────────────────────────────────────

/** Fetch available payment methods for a given amount in KWD. */
export async function initiatePayment(amount: number): Promise<PaymentMethod[]> {
  const data = await post<InitiatePaymentData>("/v2/InitiatePayment", {
    InvoiceAmount: amount,
    CurrencyIso: "KWD",
  });
  return data.PaymentMethods;
}

/** Create a payment session and return the redirect URL. */
export async function executePayment(params: {
  paymentMethodId: number;
  amount: number;
  customerName: string;
  customerMobile?: string;
  reference: string;    // our internal gift ID
  callbackUrl: string;
  errorUrl: string;
  description?: string;
}): Promise<ExecutePaymentData> {
  return post<ExecutePaymentData>("/v2/ExecutePayment", {
    PaymentMethodId: params.paymentMethodId,
    CustomerName: params.customerName,
    DisplayCurrencyIso: "KWD",
    MobileCountryCode: "+965",
    CustomerMobile: params.customerMobile ?? "00000000",
    CustomerEmail: "guest@weddingpass.app",
    InvoiceValue: params.amount,
    CallBackUrl: params.callbackUrl,
    ErrorUrl: params.errorUrl,
    Language: "ar",
    CustomerReference: params.reference,
    InvoiceItems: [
      {
        ItemName: params.description ?? "هدية زفاف",
        Quantity: 1,
        UnitPrice: params.amount,
      },
    ],
  });
}

/** Verify a payment using the PaymentId returned in the callback. */
export async function getPaymentStatus(paymentId: string): Promise<InvoiceData> {
  return post<InvoiceData>("/v2/GetPaymentStatus", {
    Key: paymentId,
    KeyType: "PaymentId",
  });
}
