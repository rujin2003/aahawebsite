import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

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

    // Create the signature digest
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET!);
    shasum.update(`${orderCreationId}|${razorpayPaymentId}`);
    const digest = shasum.digest('hex');

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