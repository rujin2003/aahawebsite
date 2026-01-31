import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const secret = process.env.RAZORPAY_SECRET;
    if (!keyId || !secret) {
      console.error('Razorpay keys missing: RAZORPAY_KEY_ID and RAZORPAY_SECRET must be set');
      return NextResponse.json(
        { error: 'Payment gateway is not configured. Please contact support.' },
        { status: 500 }
      );
    }

    const { amount, currency = 'INR', receipt } = await request.json();

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    const options = {
      amount: Math.round(amount * 100), // Convert to smallest currency unit (paise for INR)
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
    };

    const auth = btoa(`${keyId}:${secret}`);

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = (data as { error?: { description?: string; reason?: string } })?.error?.description
        ?? (data as { error?: string }).error
        ?? 'Failed to create payment order';
      console.error('Razorpay API error:', data);
      return NextResponse.json(
        { error: message },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export const runtime = 'edge';