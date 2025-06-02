-- Create contacts table
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT 'Contact Form Submission',
  message TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'website',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS contacts_email_idx ON public.contacts(email);

-- Create index on created_at for faster sorting
CREATE INDEX IF NOT EXISTS contacts_created_at_idx ON public.contacts(created_at);

-- Add RLS policies
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert contacts
CREATE POLICY "Enable insert for all users"
  ON public.contacts FOR INSERT
  WITH CHECK (true);

-- Only allow authenticated users to view contacts
CREATE POLICY "Enable select for authenticated users only"
  ON public.contacts FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only allow authenticated users to update contacts
CREATE POLICY "Enable update for authenticated users only"
  ON public.contacts FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Only allow authenticated users to delete contacts
CREATE POLICY "Enable delete for authenticated users only"
  ON public.contacts FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER handle_contacts_updated_at
BEFORE UPDATE ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at(); 