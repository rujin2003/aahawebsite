-- Create returns table
CREATE TABLE public.returns (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  order_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  status text NOT NULL,
  reason text NOT NULL,
  CONSTRAINT returns_pkey PRIMARY KEY (id),
  CONSTRAINT returns_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders (id) ON DELETE CASCADE,
  CONSTRAINT returns_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT returns_status_check CHECK (
    (
      status = ANY (
        ARRAY[
          'pending'::text,
          'approved'::text,
          'rejected'::text,
          'completed'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

-- Add RLS policies for returns table
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to insert their own returns"
ON public.returns
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to view their own returns"
ON public.returns
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own pending returns"
ON public.returns
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending'::text)
WITH CHECK (auth.uid() = user_id AND status = 'pending'::text);

-- Note: You might want to add policies for administrators to manage all returns.
-- Example:
-- CREATE POLICY "Allow admin to manage all returns"
-- ON public.returns
-- FOR ALL
-- TO service_role -- Or a specific admin role
-- USING (true)
-- WITH CHECK (true);
