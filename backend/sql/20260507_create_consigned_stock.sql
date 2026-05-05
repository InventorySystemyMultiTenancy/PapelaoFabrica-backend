-- Estoque Consignado por Cliente
CREATE TABLE IF NOT EXISTS consigned_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(client_id, product_id)
);

CREATE TABLE IF NOT EXISTS consigned_stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consigned_stock_id UUID NOT NULL REFERENCES consigned_stock(id) ON DELETE CASCADE,
  movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('entrada', 'saida')),
  quantity INTEGER NOT NULL,
  reference VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consigned_stock_client ON consigned_stock(client_id);
CREATE INDEX IF NOT EXISTS idx_consigned_stock_product ON consigned_stock(product_id);
CREATE INDEX IF NOT EXISTS idx_consigned_movements_stock ON consigned_stock_movements(consigned_stock_id);
