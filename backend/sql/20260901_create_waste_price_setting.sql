-- Preço de venda do resíduo (R$/kg), editável e persistente até nova edição
CREATE TABLE IF NOT EXISTS waste_price_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  price_per_kg NUMERIC(12,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO waste_price_settings (id, price_per_kg)
VALUES ('default', 0)
ON CONFLICT (id) DO NOTHING;
