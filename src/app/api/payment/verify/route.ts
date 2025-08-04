import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const {
      orderCreationId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
    } = await request.json();

    if (!orderCreationId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { error: 'Missing required payment verification data' },
        { status: 400 }
      );
    }

    // Create the signature digest using Web Crypto API
    const encoder = new TextEncoder();
    const keyData = encoder.encode(process.env.RAZORPAY_SECRET!);
    const messageData = encoder.encode(`${orderCreationId}|${razorpayPaymentId}`);
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    const digest = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Compare our digest with the actual signature
    if (digest !== razorpaySignature) {
      return NextResponse.json(
        { error: 'Transaction not legitimate!' },
        { status: 400 }
      );
    }

    // Payment is legitimate and verified
    return NextResponse.json({
      success: true,
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      message: 'Payment verified successfully',
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const runtime = 'edge';