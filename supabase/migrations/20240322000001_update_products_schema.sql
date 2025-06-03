-- First, create a product_sizes table
CREATE TABLE IF NOT EXISTS public.product_sizes (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    size TEXT NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(product_id, size)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS product_sizes_product_id_idx ON public.product_sizes(product_id);

-- Enable RLS
ALTER TABLE public.product_sizes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users"
    ON public.product_sizes
    FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for authenticated users only"
    ON public.product_sizes
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only"
    ON public.product_sizes
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users only"
    ON public.product_sizes
    FOR DELETE
    TO authenticated
    USING (true);

-- Create trigger for updated_at
CREATE TRIGGER handle_product_sizes_updated_at
    BEFORE UPDATE ON public.product_sizes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Modify the products table to remove the size column
ALTER TABLE public.products
    DROP COLUMN IF EXISTS size;

-- Add a new column for size configuration
ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS size_config JSONB DEFAULT '{
        "available_sizes": [],
        "size_guide": null
    }'::jsonb; 