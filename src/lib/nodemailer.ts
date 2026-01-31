import nodemailer from 'nodemailer';

const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_APP_PASSWORD;

if (!user || !pass) {
  console.warn(
    'EMAIL_USER or EMAIL_APP_PASSWORD not set. Email sending will fail until .env is configured.'
  );
}

export const mailTransporter =
  user && pass
    ? nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: { user, pass },
      })
    : null;

export function canSendEmail(): boolean {
  return mailTransporter !== null;
}

export interface ContactEmailPayload {
  name: string;
  email: string;
  subject?: string;
  message: string;
  source?: string;
}

function buildContactEmailHtml(payload: ContactEmailPayload): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Contact Form</title></head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <h2 style="color:#333">New contact form submission</h2>
  <p><strong>From:</strong> ${payload.name} &lt;${payload.email}&gt;</p>
  <p><strong>Subject:</strong> ${payload.subject ?? 'Contact Form Submission'}</p>
  ${payload.source ? `<p><strong>Source:</strong> ${payload.source}</p>` : ''}
  <h3>Message</h3>
  <p style="white-space:pre-wrap">${payload.message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
</body>
</html>`;
}

/** Send contact form email via Nodemailer (server-only). */
export async function sendContactEmail(payload: ContactEmailPayload): Promise<{ ok: boolean; error?: string }> {
  if (!canSendEmail()) {
    return { ok: false, error: 'Email not configured' };
  }
  const { name, email, message, subject = 'Contact Form Submission' } = payload;
  if (!name || !email || !message) {
    return { ok: false, error: 'Missing name, email or message' };
  }
  try {
    const html = buildContactEmailHtml(payload);
    const adminEmail = process.env.EMAIL_USER!;
    await mailTransporter!.sendMail({
      from: `"Aaha Felt Contact" <${adminEmail}>`,
      to: adminEmail,
      replyTo: email,
      subject: `Contact: ${subject}`,
      html,
      text: `From: ${name} <${email}>\nSubject: ${subject}\n\n${message}`,
    });
    return { ok: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Failed to send contact email';
    console.error('Contact email error:', err);
    return { ok: false, error };
  }
}
