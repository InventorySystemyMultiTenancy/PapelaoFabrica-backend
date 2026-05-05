-- Frete: Configurações e registros de frete nos pedidos
CREATE TABLE IF NOT EXISTS freight_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  region VARCHAR(255),
  freight_type VARCHAR(50) NOT NULL DEFAULT 'fixed' CHECK (freight_type IN ('free', 'fixed', 'per_kg', 'per_km')),
  base_amount NUMERIC(12,2) DEFAULT 0,
  price_per_kg NUMERIC(12,4),
  price_per_km NUMERIC(12,4),
  min_order_amount NUMERIC(12,2),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Frete associado ao pedido
ALTER TABLE orders ADD COLUMN IF NOT EXISTS freight_type VARCHAR(50) DEFAULT 'free';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS freight_amount NUMERIC(12,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS freight_config_id UUID REFERENCES freight_configs(id);

CREATE INDEX IF NOT EXISTS idx_freight_configs_active ON freight_configs(active);
