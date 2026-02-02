-- Add customer_name and customer_email columns to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS customer_email TEXT;

-- Update existing orders to populate customer_name and customer_email from auth.users
UPDATE public.orders o
SET
  customer_name = COALESCE(p.full_name, u.email, 'Customer'),
  customer_email = u.email
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE o.user_id = u.id
  AND (o.customer_name IS NULL OR o.customer_email IS NULL);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);
