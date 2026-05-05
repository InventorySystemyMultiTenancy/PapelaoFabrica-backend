-- Pedidos de Compra (Indústria)
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number SERIAL,
  supplier VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'confirmed', 'received', 'cancelled')),
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  expected_delivery_date DATE,
  sent_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id),
  description VARCHAR(255) NOT NULL,
  gramatura NUMERIC(10,2),
  sheet_width_cm NUMERIC(10,2),
  sheet_length_cm NUMERIC(10,2),
  quantity_kg NUMERIC(10,3) NOT NULL,
  unit_price_per_kg NUMERIC(12,4),
  total_price NUMERIC(12,2),
  received_kg NUMERIC(10,3) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po_id ON purchase_order_items(purchase_order_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'purchase_order_items'
      AND column_name = 'product_id'
      AND udt_name = 'uuid'
  ) THEN
    ALTER TABLE public.purchase_order_items
      DROP CONSTRAINT IF EXISTS purchase_order_items_product_id_fkey;

    ALTER TABLE public.purchase_order_items
      ALTER COLUMN product_id TYPE TEXT USING product_id::text;

    ALTER TABLE public.purchase_order_items
      ADD CONSTRAINT purchase_order_items_product_id_fkey
      FOREIGN KEY (product_id)
      REFERENCES public.products(id);
  END IF;
END $$;
