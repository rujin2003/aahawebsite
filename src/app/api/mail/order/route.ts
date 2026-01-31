import { NextResponse } from 'next/server';
import { sendOrderEmailEdge } from '@/lib/email-edge';

export const runtime = 'edge';

interface OrderPayload {
  order_id: string;
  customer_email: string;
  customer_name: string;
  status?: string;
  total_amount: number;
  shipping_address: string;
  tracking_number?: string;
  estimated_delivery?: string;
  items: Array<{ product_id?: string; product_name: string; product_image?: string; quantity: number; price: number; size?: string }>;
  discount_amount?: number;
  promo_code?: string;
  payment_id?: string;
  created_at?: string;
}

export async function POST(request: Request) {
  try {
    const payload: OrderPayload = await request.json();
    const { order_id, customer_email, customer_name } = payload;

    if (!customer_email || !order_id) {
      return NextResponse.json(
        { status: 'error', message: 'Missing customer_email or order_id' },
        { status: 400 }
      );
    }

    const result = await sendOrderEmailEdge({
      order_id,
      customer_email,
      customer_name,
      status: payload.status,
      total_amount: payload.total_amount,
      shipping_address: payload.shipping_address,
      tracking_number: payload.tracking_number,
      estimated_delivery: payload.estimated_delivery,
      items: payload.items.map((i) => ({ product_name: i.product_name, quantity: i.quantity, price: i.price })),
      discount_amount: payload.discount_amount,
      created_at: payload.created_at,
    });

    if (!result.ok) {
      return NextResponse.json(
        { status: 'error', message: result.error ?? 'Failed to send order email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ status: 'ok', message: 'Order confirmation email sent' });
  } catch (error) {
    console.error('Order mail error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to send order email',
      },
      { status: 500 }
    );
  }
}
