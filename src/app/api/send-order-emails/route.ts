import { NextResponse } from 'next/server';
import { sendAdminOrderEmail, sendCustomerPaymentEmail } from '@/lib/email-api';
import { supabase } from '@/lib/supabase';

export const runtime = 'edge';

/**
 * POST /api/send-order-emails
 * Triggered after successful order placement:
 * 1) Admin notification (admin_order)
 * 2) Customer payment confirmation (customer_payment)
 * Sequential; does not block order completion if emails fail.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    let orderId = body.orderId as string | undefined;
    let customerName = body.customerName as string | undefined;
    let customerEmail = body.customerEmail as string | undefined;
    let total = body.total as number | undefined;

    // If only orderId provided (e.g. from checkout), fetch order details
    if (orderId && (customerName == null || customerEmail == null || total == null)) {
      const { data: order, error } = await supabase
        .from('orders')
        .select('id, customer_name, customer_email, total_amount')
        .eq('id', orderId)
        .single();
      if (!error && order) {
        orderId = order.id;
        customerName = customerName ?? order.customer_name ?? 'Customer';
        customerEmail = customerEmail ?? order.customer_email ?? '';
        total = total ?? order.total_amount ?? 0;
      }
    }

    if (!orderId || !customerName || total == null) {
      return NextResponse.json(
        { error: 'Missing orderId, customerName, or total' },
        { status: 400 }
      );
    }

    const adminResult = await sendAdminOrderEmail({ orderId, customerName, total });
    const customerResult = customerEmail
      ? await sendCustomerPaymentEmail({ orderId, customerName, customerEmail })
      : { ok: false, error: 'No customer email' };

    return NextResponse.json({
      adminSent: adminResult.ok,
      customerSent: customerResult.ok,
      adminError: adminResult.error ?? undefined,
      customerError: customerResult.error ?? undefined,
    });
  } catch (error) {
    console.error('[send-order-emails] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send order emails' },
      { status: 500 }
    );
  }
}
