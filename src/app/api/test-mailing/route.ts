import { NextResponse } from 'next/server';
import { sendContactFormEmail, sendOrderConfirmationEmail } from '@/lib/mailing';

export async function POST(request: Request) {
  try {
    const { testType } = await request.json();

    if (testType === 'contact') {
      // Test contact form email
      const contactPayload = {
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test Contact Form',
        message: 'This is a test message from the contact form.',
        source: 'test',
        created_at: new Date().toISOString()
      };

      const result = await sendContactFormEmail(contactPayload);
      return NextResponse.json({ success: true, result });
    } else if (testType === 'order') {
      // Test order confirmation email
      const orderPayload = {
        order_id: 'test-order-123',
        user_id: 'test-user-123',
        customer_email: 'test@example.com',
        customer_name: 'Test Customer',
        status: 'processing',
        total_amount: 99.99,
        shipping_address: '123 Test Street, Test City, Test State 12345',
        items: [
          {
            product_id: 'test-product-1',
            product_name: 'Test Product',
            product_image: 'https://example.com/test-image.jpg',
            quantity: 2,
            price: 49.99,
            size: 'M'
          }
        ],
        country_code: 'US',
        created_at: new Date().toISOString()
      };

      const result = await sendOrderConfirmationEmail(orderPayload);
      return NextResponse.json({ success: true, result });
    } else {
      return NextResponse.json(
        { error: 'Invalid test type. Use "contact" or "order"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Test mailing error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export const runtime = 'edge';
