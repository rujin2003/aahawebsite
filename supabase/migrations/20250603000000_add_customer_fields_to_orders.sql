-- Add customer_name and customer_email to orders for mail API and display
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_name') THEN
    ALTER TABLE public.orders ADD COLUMN customer_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_email') THEN
    ALTER TABLE public.orders ADD COLUMN customer_email TEXT;
  END IF;
END $$;
