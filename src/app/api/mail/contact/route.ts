import { NextResponse } from 'next/server';
import { sendContactEmailEdge } from '@/lib/email-edge';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    if (!payload?.name || !payload?.email || !payload?.message) {
      return NextResponse.json(
        { status: 'error', message: 'Missing name, email or message' },
        { status: 400 }
      );
    }

    const result = await sendContactEmailEdge({
      name: payload.name,
      email: payload.email,
      subject: payload.subject,
      message: payload.message,
      source: payload.source,
    });

    if (!result.ok) {
      return NextResponse.json(
        { status: 'error', message: result.error ?? 'Failed to send contact email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ status: 'ok', message: 'Contact email sent' });
  } catch (error) {
    console.error('Contact mail error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to send contact email',
      },
      { status: 500 }
    );
  }
}
