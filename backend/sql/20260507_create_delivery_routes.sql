-- Roteiros de Entrega
CREATE TABLE IF NOT EXISTS delivery_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  driver_name VARCHAR(255),
  vehicle VARCHAR(255),
  scheduled_date DATE NOT NULL,
  departure_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_route_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES delivery_routes(id) ON DELETE CASCADE,
  shipment_id TEXT REFERENCES shipments(id),
  client_id TEXT REFERENCES clients(id),
  client_name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  delivered_at TIMESTAMPTZ,
  received_by VARCHAR(255),
  delivery_notes TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_routes_status ON delivery_routes(status);
CREATE INDEX IF NOT EXISTS idx_delivery_routes_scheduled_date ON delivery_routes(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_delivery_route_items_route_id ON delivery_route_items(route_id);
CREATE INDEX IF NOT EXISTS idx_delivery_route_items_status ON delivery_route_items(status);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'delivery_route_items'
      AND column_name = 'client_id'
      AND udt_name = 'uuid'
  ) THEN
    ALTER TABLE public.delivery_route_items
      DROP CONSTRAINT IF EXISTS delivery_route_items_client_id_fkey;

    ALTER TABLE public.delivery_route_items
      ALTER COLUMN client_id TYPE TEXT USING client_id::text;

    ALTER TABLE public.delivery_route_items
      ADD CONSTRAINT delivery_route_items_client_id_fkey
      FOREIGN KEY (client_id)
      REFERENCES public.clients(id);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'delivery_route_items'
      AND column_name = 'shipment_id'
      AND udt_name = 'uuid'
  ) THEN
    ALTER TABLE public.delivery_route_items
      DROP CONSTRAINT IF EXISTS delivery_route_items_shipment_id_fkey;

    ALTER TABLE public.delivery_route_items
      ALTER COLUMN shipment_id TYPE TEXT USING shipment_id::text;

    ALTER TABLE public.delivery_route_items
      ADD CONSTRAINT delivery_route_items_shipment_id_fkey
      FOREIGN KEY (shipment_id)
      REFERENCES public.shipments(id);
  END IF;
END $$;
