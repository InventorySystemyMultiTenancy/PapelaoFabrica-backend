-- Base schema: tabelas fundamentais que os demais scripts esperam já existir.
-- Este script usa CREATE TABLE IF NOT EXISTS para ser idempotente.

CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT,
  stock_quantity NUMERIC(14,3) NOT NULL DEFAULT 0,
  low_stock_alert_quantity NUMERIC(14,3) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.production_orders (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  description TEXT,
  production_status TEXT NOT NULL DEFAULT 'pending',
  delivery_date TIMESTAMPTZ,
  installation_team TEXT,
  initial_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.production_order_materials (
  id BIGSERIAL PRIMARY KEY,
  production_order_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity NUMERIC(14,3) NOT NULL DEFAULT 0,
  unit TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_pom_production_order
    FOREIGN KEY (production_order_id)
    REFERENCES public.production_orders(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_production_orders_status
  ON public.production_orders (production_status);

CREATE INDEX IF NOT EXISTS idx_production_orders_created_at
  ON public.production_orders (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pom_production_order_id
  ON public.production_order_materials (production_order_id);
