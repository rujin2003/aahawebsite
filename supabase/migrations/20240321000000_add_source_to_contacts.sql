-- Add source column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'contacts' 
        AND column_name = 'source'
    ) THEN
        ALTER TABLE public.contacts 
        ADD COLUMN source TEXT NOT NULL DEFAULT 'website';
    END IF;
END $$; 