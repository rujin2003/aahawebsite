/**
 * Edge-compatible email sending (no Node/Nodemailer).
 * Used when deployed to Cloudflare where runtime is Edge only.
 * Set RESEND_API_KEY in env, or MAIL_SERVICE_URL to proxy to your own Node mail service.
 */

const RESEND_API = 'https://api.resend.com/emails';

export interface ContactEmailPayload {
  name: string;
  email: string;
  subject?: string;
  message: string;
  source?: string;
}

export interface OrderEmailPayload {
  order_id: string;
  customer_email: string;
  customer_name: string;
  status?: string;
  total_amount: number;
  shipping_address: string;
  tracking_number?: string;
  estimated_delivery?: string;
  items: Array<{ product_name: string; quantity: number; price: number }>;
  discount_amount?: number;
  created_at?: string;
}

function canUseResend(): boolean {
  return typeof process.env.RESEND_API_KEY === 'string' && process.env.RESEND_API_KEY.length > 0;
}

function getMailServiceUrl(): string {
  const url = process.env.MAIL_SERVICE_URL;
  return url ? url.replace(/\/$/, '') : '';
}

function buildContactHtml(payload: ContactEmailPayload): string {
  const subject = payload.subject ?? 'Contact Form Submission';
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Contact Form</title></head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <h2 style="color:#333">New contact form submission</h2>
  <p><strong>From:</strong> ${payload.name} &lt;${payload.email}&gt;</p>
  <p><strong>Subject:</strong> ${subject}</p>
  ${payload.source ? `<p><strong>Source:</strong> ${payload.source}</p>` : ''}
  <h3>Message</h3>
  <p style="white-space:pre-wrap">${payload.message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
</body>
</html>`;
}

function buildOrderHtml(payload: OrderEmailPayload): string {
  const itemsRows = payload.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee">${item.product_name}</td>
          <td style="padding:8px;border-bottom:1px solid #eee">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee">₹${item.price}</td>
        </tr>`
    )
    .join('');
  const subtotal = payload.items.reduce((s, i) => s + i.quantity * i.price, 0);
  const discount = payload.discount_amount ?? 0;
  const total = payload.total_amount;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Order Confirmation</title></head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <h2 style="color:#333">Order Confirmation</h2>
  <p>Hi ${payload.customer_name},</p>
  <p>Thank you for your order. Here are the details:</p>
  <p><strong>Order ID:</strong> ${payload.order_id}</p>
  <p><strong>Status:</strong> ${payload.status ?? 'Confirmed'}</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <thead>
      <tr style="background:#f5f5f5">
        <th style="padding:8px;text-align:left">Item</th>
        <th style="padding:8px;text-align:left">Qty</th>
        <th style="padding:8px;text-align:left">Price</th>
      </tr>
    </thead>
    <tbody>${itemsRows}</tbody>
  </table>
  <p><strong>Subtotal:</strong> ₹${subtotal}</p>
  ${discount > 0 ? `<p><strong>Discount:</strong> -₹${discount}</p>` : ''}
  <p><strong>Total:</strong> ₹${total}</p>
  <p><strong>Shipping address:</strong><br/>${payload.shipping_address.replace(/\n/g, '<br/>')}</p>
  ${payload.tracking_number ? `<p><strong>Tracking:</strong> ${payload.tracking_number}</p>` : ''}
  ${payload.estimated_delivery ? `<p><strong>Estimated delivery:</strong> ${payload.estimated_delivery}</p>` : ''}
  <p>If you have any questions, reply to this email.</p>
</body>
</html>`;
}

/** Send contact email via Resend (Edge) or proxy to MAIL_SERVICE_URL. */
export async function sendContactEmailEdge(payload: ContactEmailPayload): Promise<{ ok: boolean; error?: string }> {
  const base = getMailServiceUrl();
  if (base) {
    try {
      const res = await fetch(`${base}/api/mail/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { ok: false, error: (data as { message?: string }).message ?? 'Mail service error' };
      }
      return { ok: true };
    } catch (e) {
      const err = e instanceof Error ? e.message : 'Request failed';
      return { ok: false, error: err };
    }
  }
  if (!canUseResend()) {
    return { ok: false, error: 'Email not configured (set RESEND_API_KEY or MAIL_SERVICE_URL)' };
  }
  const from = process.env.RESEND_FROM ?? 'Aaha Felt <onboarding@resend.dev>';
  const to = process.env.EMAIL_USER ?? process.env.RESEND_TO ?? 'onboarding@resend.dev';
  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: payload.email,
        subject: `Contact: ${payload.subject ?? 'Contact Form Submission'}`,
        html: buildContactHtml(payload),
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: (data as { message?: string }).message ?? `Resend ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    const err = e instanceof Error ? e.message : 'Resend request failed';
    return { ok: false, error: err };
  }
}

/** Send order confirmation via Resend (Edge) or proxy to MAIL_SERVICE_URL. */
export async function sendOrderEmailEdge(payload: OrderEmailPayload): Promise<{ ok: boolean; error?: string }> {
  const base = getMailServiceUrl();
  if (base) {
    try {
      const res = await fetch(`${base}/api/mail/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { ok: false, error: (data as { message?: string }).message ?? 'Mail service error' };
      }
      return { ok: true };
    } catch (e) {
      const err = e instanceof Error ? e.message : 'Request failed';
      return { ok: false, error: err };
    }
  }
  if (!canUseResend()) {
    return { ok: false, error: 'Email not configured (set RESEND_API_KEY or MAIL_SERVICE_URL)' };
  }
  const from = process.env.RESEND_FROM ?? 'Aaha Felt <onboarding@resend.dev>';
  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from,
        to: [payload.customer_email],
        subject: `Order Confirmation – ${payload.order_id}`,
        html: buildOrderHtml(payload),
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: (data as { message?: string }).message ?? `Resend ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    const err = e instanceof Error ? e.message : 'Resend request failed';
    return { ok: false, error: err };
  }
}
