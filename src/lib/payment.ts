import { supabase } from './supabase';
import { RazorpayOptions, RazorpayResponse, RazorpayOrder } from '@/types/razorpay';

export interface PaymentData {
  orderCreationId: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
}

export interface PaymentRecord {
  id: string;
  order_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method: string;
  verified_at?: string;
}

// Load Razorpay script
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// Create Razorpay order
export async function createRazorpayOrder(amount: number, currency: string = 'INR'): Promise<RazorpayOrder> {
  const response = await fetch('/api/payment/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      currency,
      receipt: `receipt_${Date.now()}`,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = (data as { error?: string }).error ?? 'Failed to create payment order';
    console.error('Razorpay order creation failed:', data);
    throw new Error(message);
  }

  return data as RazorpayOrder;
}

// Verify payment
export async function verifyPayment(paymentData: PaymentData): Promise<{ success: boolean; error?: string }> {
  const response = await fetch('/api/payment/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(paymentData),
  });

  const data = await response.json().catch(() => ({ success: false }));

  if (!response.ok) {
    const error = (data as { error?: string }).error ?? 'Payment verification failed';
    console.error('Payment verification failed:', data);
    return { success: false, error };
  }

  return data as { success: boolean; error?: string };
}

// Save payment record to database
export async function savePaymentRecord(
  orderId: string,
  paymentData: PaymentData,
  amount: number,
  currency: string = 'INR'
): Promise<PaymentRecord> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .insert([
        {
          order_id: orderId,
          razorpay_order_id: paymentData.razorpayOrderId,
          razorpay_payment_id: paymentData.razorpayPaymentId,
          amount,
          currency,
          status: 'completed',
          verified_at: new Date().toISOString(),
          metadata: {
            signature: paymentData.razorpaySignature,
            order_creation_id: paymentData.orderCreationId,
          },
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving payment record:', error);
    throw error;
  }
}

// Update order with payment information
export async function updateOrderWithPayment(orderId: string, paymentId: string) {
  try {
    const { error } = await supabase
      .from('orders')
      .update({
        payment_id: paymentId,
        status: 'pending', // Change from 'to_be_verified' to 'pending' after successful payment
      })
      .eq('id', orderId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating order with payment:', error);
    throw error;
  }
}

// Send order confirmation email
export async function sendOrderConfirmationEmail(orderId: string) {
  try {
    // Get order details with items and user information
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `)
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;

    // Get user information - handle both client and server contexts
    let userEmail = '';
    let userName = 'Customer';
    let userId = '';

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!userError && user) {
        userEmail = user.email || '';
        userId = user.id;
        
        // Get user profile for additional details
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        userName = profile?.full_name || user.user_metadata?.full_name || 'Customer';
      }
    } catch (authError) {
      console.warn('Could not get user from auth context, using order data:', authError);
      // Fall back to order data if auth context is not available
      userEmail = order.customer_email || '';
      userName = order.customer_name || 'Customer';
      userId = order.user_id || '';
    }

    // Prepare email payload
    const emailPayload = {
      order_id: order.id,
      user_id: userId,
      customer_email: userEmail,
      customer_name: userName,
      status: order.status,
      total_amount: order.total_amount,
      shipping_address: order.shipping_address,
      tracking_number: order.tracking_number,
      estimated_delivery: order.estimated_delivery,
      items: order.items.map((item: any) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        product_image: item.product_image || '',
        quantity: item.quantity,
        price: item.price,
        size: item.size
      })),
      country_code: order.country_code,
      promo_code: order.promo_code,
      discount_amount: order.discount_amount,
      payment_id: order.payment_id,
      created_at: order.created_at
    };

    // Import and call the mailing service
    const { sendOrderConfirmationEmail: sendEmail } = await import('@/lib/mailing');
    const emailResponse = await sendEmail(emailPayload);
    
    console.log('Order confirmation email sent successfully:', emailResponse);
    return emailResponse;
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    // Don't throw error to avoid breaking the payment flow
    // Just log the error and continue
    return null;
  }
}

// Get payment by order ID
export async function getPaymentByOrderId(orderId: string): Promise<PaymentRecord | null> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; 
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error getting payment by order ID:', error);
    throw error;
  }
}

// Create Razorpay payment object
export function createRazorpayPayment(options: RazorpayOptions) {
  if (typeof window === 'undefined' || !window.Razorpay) {
    throw new Error('Razorpay not loaded');
  }
  
  return new window.Razorpay(options);
} 