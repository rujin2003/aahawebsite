-- Enable RLS on orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Enable RLS on order_items table
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create policy for orders table
CREATE POLICY "Users can view their own orders"
ON public.orders
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
ON public.orders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders"
ON public.orders
FOR UPDATE
USING (auth.uid() = user_id);

-- Create policy for order_items table
CREATE POLICY "Users can view their own order items"
ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own order items"
ON public.order_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own order items"
ON public.order_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Create function to sync order items
CREATE OR REPLACE FUNCTION sync_order_items()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete existing order items for this order
  DELETE FROM public.order_items WHERE order_id = NEW.id;
  
  -- Insert new order items from the items JSONB array
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
    (item->>'quantity')::integer,
    (item->>'price')::numeric,
    item->>'product_name',
    item->>'product_image',
    item->>'size'
  FROM jsonb_array_elements(NEW.items) AS item;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for syncing order items
DROP TRIGGER IF EXISTS sync_order_items_trigger ON public.orders;
CREATE TRIGGER sync_order_items_trigger
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION sync_order_items(); 