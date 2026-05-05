-- Gestão de Resíduos
CREATE TABLE IF NOT EXISTS waste_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg NUMERIC(10,3) NOT NULL,
  description VARCHAR(255),
  sold BOOLEAN NOT NULL DEFAULT FALSE,
  sale_amount NUMERIC(12,2),
  sold_at TIMESTAMPTZ,
  buyer VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waste_records_date ON waste_records(record_date);
CREATE INDEX IF NOT EXISTS idx_waste_records_sold ON waste_records(sold);
