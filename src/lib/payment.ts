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
  try {
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

    if (!response.ok) {
      throw new Error('Failed to create payment order');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
}

// Verify payment
export async function verifyPayment(paymentData: PaymentData) {
  try {
    const response = await fetch('/api/payment/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      throw new Error('Payment verification failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
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