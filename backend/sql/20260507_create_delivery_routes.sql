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
  shipment_id UUID REFERENCES shipments(id),
  client_id UUID REFERENCES clients(id),
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
