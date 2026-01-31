-- Fix sync_order_items trigger: handle null/undefined size (order_items.size is NOT NULL)
-- Also handle null product_image and product_name for robustness

CREATE OR REPLACE FUNCTION sync_order_items()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete existing order items for this order
  DELETE FROM public.order_items WHERE order_id = NEW.id;
  
  -- Insert new order items from the items JSONB array
  -- Use COALESCE for size (NOT NULL column) and optional fields
  INSERT INTO public.order_items (
    order_id,
    product_id,
    quantity,
    price,
    product_name,
    product_image,
    size
  )
  SELECT
    NEW.id,
    (item->>'product_id')::uuid,
    COALESCE((item->>'quantity')::integer, 1),
    COALESCE((item->>'price')::numeric, 0),
    COALESCE(NULLIF(TRIM(item->>'product_name'), ''), 'Product'),
    NULLIF(TRIM(item->>'product_image'), ''),
    COALESCE(NULLIF(TRIM(item->>'size'), ''), 'N/A')
  FROM jsonb_array_elements(NEW.items) AS item;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
