# Razorpay Payment Integration Setup

This guide will help you set up Razorpay payment integration for your e-commerce website.

## Prerequisites

1. A Razorpay account (sign up at https://razorpay.com)
2. Your Razorpay API keys (Key ID and Secret)

## Environment Variables

Create a `.env.local` (or `.env`) file in your project root and add:

```env
# Razorpay Configuration
# Key ID = "Live API Key" from Razorpay Dashboard (used server + client)
RAZORPAY_KEY_ID=rzp_live_xxxx
RAZORPAY_SECRET=your_live_secret_here
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxx
```

**Which key to use:**
- **Live API Key** (starts with `rzp_live_`) → set as `RAZORPAY_KEY_ID` and `NEXT_PUBLIC_RAZORPAY_KEY_ID` (same value).
- **Live Key Secret** → set as `RAZORPAY_SECRET` only. Never put the secret in `NEXT_PUBLIC_*` or in client code.

## Database Setup

Run the following migration to create the payments table:

```bash
# If using Supabase CLI
supabase db push

# Or manually run the migration file:
# supabase/migrations/20250101000000_create_payments_table.sql
```

## API Routes

The following API routes have been created:

- `POST /api/payment/orders` - Creates a Razorpay order
- `POST /api/payment/verify` - Verifies payment signature

## Payment Flow

1. User clicks "Pay Now" in cart
2. Order is created in database with status 'to_be_verified'
3. Razorpay order is created via API
4. Payment modal opens with user details pre-filled
5. User completes payment
6. Payment is verified on server
7. Payment record is saved to database
8. Order status is updated to 'pending'
9. Cart is cleared and success message shown

## Testing

For testing, use Razorpay's test mode:

- Test Card Number: 4111 1111 1111 1111
- Expiry: Any future date
- CVV: Any 3 digits
- Name: Any name

## Production Setup

1. Switch to Razorpay live mode
2. Update environment variables with live keys
3. Ensure SSL is enabled for production
4. Test the complete payment flow

## Security Notes

- Never expose your Razorpay secret key in client-side code
- Always verify payment signatures on the server
- Use HTTPS in production
- Implement proper error handling

## Troubleshooting

### Common Issues

1. **Payment verification fails**: Check if your secret key is correct
2. **Script loading fails**: Ensure internet connection and Razorpay CDN is accessible
3. **Order creation fails**: Verify your Razorpay key ID and secret
4. **Database errors**: Ensure the payments table is created and RLS policies are set

### Debug Mode

Enable debug logging by adding to your environment:

```env
NEXT_PUBLIC_DEBUG=true
```

## Support

For Razorpay-specific issues, contact Razorpay support.
For application-specific issues, check the console logs and network tab. 