ALTER TABLE public.consigned_stock
  ADD COLUMN IF NOT EXISTS order_id TEXT;

ALTER TABLE public.consigned_stock
  DROP CONSTRAINT IF EXISTS consigned_stock_order_id_fkey;

ALTER TABLE public.consigned_stock
  ADD CONSTRAINT consigned_stock_order_id_fkey
  FOREIGN KEY (order_id)
  REFERENCES public.orders(id)
  ON DELETE SET NULL;

ALTER TABLE public.consigned_stock
  DROP CONSTRAINT IF EXISTS consigned_stock_client_id_product_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS ux_consigned_stock_client_product_order
  ON public.consigned_stock (
    client_id,
    COALESCE(product_id, ''),
    COALESCE(order_id, '')
  );

CREATE INDEX IF NOT EXISTS idx_consigned_stock_order_id
  ON public.consigned_stock(order_id);
