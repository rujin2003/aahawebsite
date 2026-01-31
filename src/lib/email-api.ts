/**
 * Reusable helpers for the deployed mail API (POST /api/send-mail).
 * Uses MAIL_API_URL and MAIL_API_SECRET from env; server-only (do not expose secret in UI).
 */

const MAIL_API_URL = process.env.MAIL_API_URL?.replace(/\/$/, '');
const API_SECRET = process.env.MAIL_API_SECRET;

export type MailType = 'admin_order' | 'customer_payment' | 'contact';

export interface AdminOrderData {
  orderId: string;
  customerName: string;
  total: number;
}

export interface CustomerPaymentData {
  orderId: string;
  customerName: string;
  customerEmail: string;
}

export interface ContactData {
  name: string;
  email: string;
  message: string;
}

function isConfigured(): boolean {
  return Boolean(MAIL_API_URL && API_SECRET);
}

/**
 * Send a single email via the mail API.
 * Handles network errors gracefully; logs errors for debugging.
 */
export async function sendMail(
  type: MailType,
  data: AdminOrderData | CustomerPaymentData | ContactData
): Promise<{ ok: boolean; error?: string }> {
  if (!isConfigured()) {
    console.warn('[email-api] MAIL_API_URL or MAIL_API_SECRET not set');
    return { ok: false, error: 'Email not configured' };
  }
  try {
    const res = await fetch(`${MAIL_API_URL}/api/send-mail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_SECRET}`,
      },
      body: JSON.stringify({ type, data }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('[email-api] Mail API error:', res.status, text);
      return { ok: false, error: text || `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    console.error('[email-api] Request failed:', message);
    return { ok: false, error: message };
  }
}

/**
 * Notify admin when a new order is placed.
 */
export async function sendAdminOrderEmail(payload: AdminOrderData): Promise<{ ok: boolean; error?: string }> {
  return sendMail('admin_order', payload);
}

/**
 * Send payment confirmation to the customer after order placement.
 */
export async function sendCustomerPaymentEmail(payload: CustomerPaymentData): Promise<{ ok: boolean; error?: string }> {
  return sendMail('customer_payment', payload);
}

/**
 * Send contact form submission to admin.
 */
export async function sendContactEmail(payload: ContactData): Promise<{ ok: boolean; error?: string }> {
  return sendMail('contact', payload);
}
