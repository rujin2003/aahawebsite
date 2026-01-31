import { NextResponse } from 'next/server';
import { mailTransporter, canSendEmail } from '@/lib/nodemailer';

export const runtime = 'nodejs';

interface OrderItem {
  product_id: string;
  product_name: string;
  product_image: string;
  quantity: number;
  price: number;
  size?: string;
}

interface OrderPayload {
  order_id: string;
  customer_email: string;
  customer_name: string;
  status?: string;
  total_amount: number;
  shipping_address: string;
  tracking_number?: string;
  estimated_delivery?: string;
  items: OrderItem[];
  discount_amount?: number;
  promo_code?: string;
  payment_id?: string;
  created_at?: string;
}

function buildOrderEmailHtml(payload: OrderPayload): string {
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

export async function POST(request: Request) {
  if (!canSendEmail()) {
    return NextResponse.json(
      { status: 'error', message: 'Email not configured' },
      { status: 500 }
    );
  }

  try {
    const payload: OrderPayload = await request.json();
    const { order_id, customer_email, customer_name } = payload;

    if (!customer_email || !order_id) {
      return NextResponse.json(
        { status: 'error', message: 'Missing customer_email or order_id' },
        { status: 400 }
      );
    }

    const html = buildOrderEmailHtml(payload);

    await mailTransporter!.sendMail({
      from: `"Aaha Felt" <${process.env.EMAIL_USER}>`,
      to: customer_email,
      subject: `Order Confirmation – ${order_id}`,
      html,
      text: `Order ${order_id} confirmed for ${customer_name}. Total: ₹${payload.total_amount}. Shipping: ${payload.shipping_address}`,
    });

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
