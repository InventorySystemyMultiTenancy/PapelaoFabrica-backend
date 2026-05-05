-- Base schema: tabelas fundamentais que os demais scripts esperam já existir.
-- Este script usa CREATE TABLE IF NOT EXISTS para ser idempotente.

CREATE TABLE IF NOT EXISTS public.employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  position TEXT,
  phone TEXT,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'funcionario',
  password_hash TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_email_unique
  ON public.employees (LOWER(email))
  WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'interna',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_teams_name_unique
  ON public.teams (LOWER(name));

CREATE TABLE IF NOT EXISTS public.team_members (
  team_id TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (team_id, employee_id),
  CONSTRAINT fk_team_members_team
    FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE,
  CONSTRAINT fk_team_members_employee
    FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_team_members_employee_id
  ON public.team_members (employee_id);

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
