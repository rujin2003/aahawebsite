-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  razorpay_order_id TEXT NOT NULL,
  razorpay_payment_id TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT DEFAULT 'razorpay',
  metadata JSONB DEFAULT '{}'::jsonb,
  verified_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  refund_amount DECIMAL(10,2),
  refund_reason TEXT
);

-- Add RLS policies for payments table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own payments
CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = payments.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Policy for admins to view all payments
CREATE POLICY "Admins can view all payments" ON payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
    )
  );

-- Policy for inserting payments (only through API)
CREATE POLICY "Allow payment insertion" ON payments
  FOR INSERT WITH CHECK (true);

-- Policy for updating payments (only through API)
CREATE POLICY "Allow payment updates" ON payments
  FOR UPDATE USING (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id ON payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- Add payment_id column to orders table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_id') THEN
    ALTER TABLE orders ADD COLUMN payment_id UUID REFERENCES payments(id);
  END IF;
END $$; 