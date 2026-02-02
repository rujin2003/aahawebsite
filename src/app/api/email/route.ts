import { NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * Proxy to external mail service: POST /api/email
 * Expects { type: 'order_placed', data: {...} }
 *
 * Frontend sends raw Supabase order ID - backend will hash it for display.
 * Frontend must send full order data including items array.
 * Backend handles both admin and customer emails automatically.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const mailApiUrl = process.env.MAIL_API_URL?.replace(/\/$/, '');
    const apiSecret = process.env.MAIL_API_SECRET;

    if (!mailApiUrl || !apiSecret) {
      return NextResponse.json(
        { error: 'Mail API not configured' },
        { status: 500 }
      );
    }

    const res = await fetch(`${mailApiUrl}/api/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiSecret}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: text || `HTTP ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data);
  } catch (error) {
    console.error('[email] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    );
  }
}
