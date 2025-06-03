-- Create admins table
CREATE TABLE IF NOT EXISTS public.admins (
  id uuid not null default extensions.uuid_generate_v4(),
  user_id uuid null,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  constraint admins_pkey primary key (id),
  constraint admins_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

-- Enable RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users"
  ON public.admins
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for authenticated users only"
  ON public.admins
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only"
  ON public.admins
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users only"
  ON public.admins
  FOR DELETE
  TO authenticated
  USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS admins_user_id_idx ON public.admins(user_id);

-- Create trigger for updated_at
CREATE TRIGGER handle_admins_updated_at
  BEFORE UPDATE ON public.admins
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at(); 