-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for all users" ON public.contacts;
DROP POLICY IF EXISTS "Enable select for authenticated users only" ON public.contacts;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.contacts;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.contacts;

-- Recreate policies with correct permissions
CREATE POLICY "Enable insert for all users" ON public.contacts
    FOR INSERT TO public
    WITH CHECK (true);

CREATE POLICY "Enable select for authenticated users only" ON public.contacts
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Enable update for authenticated users only" ON public.contacts
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users only" ON public.contacts
    FOR DELETE TO authenticated
    USING (true); 