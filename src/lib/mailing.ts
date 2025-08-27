const MAILING_SERVICE_BASE_URL =
  process.env.NEXT_PUBLIC_MAILING_SERVICE_BASE_URL || "http://localhost:8081";


export interface OrderEmailPayload {
  order_id: string;
  user_id?: string;
  customer_email: string;
  customer_name: string;
  status?: string;
  total_amount: number;
  shipping_address: string;
  tracking_number?: string;
  estimated_delivery?: string;
  items: Array<{
    product_id: string;
    product_name: string;
    product_image: string;
    quantity: number;
    price: number;
    size?: string;
  }>;
  country_code?: string;
  promo_code?: string;
  discount_amount?: number;
  payment_id?: string;
  created_at?: string;
}

export interface ContactEmailPayload {
  user_id?: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  source?: string;
  created_at?: string;
}

export interface MailingServiceResponse {
  status: string;
  message: string;
}

/**
 * Send order confirmation email via the Go mailing microservice
 */
export async function sendOrderConfirmationEmail(payload: OrderEmailPayload): Promise<MailingServiceResponse> {
  try {
    console.log('Sending order confirmation email with payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(`${MAILING_SERVICE_BASE_URL}/api/mail/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('Mailing service response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Mailing service error response:', errorData);
      
      // Provide more specific error messages based on status code
      let errorMessage = 'Failed to send order confirmation email';
      if (response.status === 400) {
        errorMessage = 'Invalid order data provided';
      } else if (response.status === 500) {
        errorMessage = 'Email service temporarily unavailable';
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Mailing service success response:', data);
    return data;
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to send order confirmation email');
  }
}

/**
 * Send contact form email via the Go mailing microservice
 */
export async function sendContactFormEmail(payload: ContactEmailPayload): Promise<MailingServiceResponse> {
  try {
    console.log('Sending contact form email with payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(`${MAILING_SERVICE_BASE_URL}/api/mail/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('Mailing service response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Mailing service error response:', errorData);
      
      // Provide more specific error messages based on status code
      let errorMessage = 'Failed to send contact form email';
      if (response.status === 400) {
        errorMessage = 'Invalid contact form data provided';
      } else if (response.status === 500) {
        errorMessage = 'Email service temporarily unavailable';
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Mailing service success response:', data);
    return data;
  } catch (error) {
    console.error('Error sending contact form email:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to send contact form email');
  }
}
