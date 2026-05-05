-- ============================================================
-- Paperboard Factory Modules
-- ============================================================

-- 1. Budget Paperboard Config (extends budgets)
CREATE TABLE IF NOT EXISTS public.budget_paperboard_configs (
  id                   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  budget_id            TEXT NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  length               NUMERIC(10,2) NOT NULL CHECK (length > 0),
  width                NUMERIC(10,2) NOT NULL CHECK (width > 0),
  height               NUMERIC(10,2) NOT NULL CHECK (height > 0),
  gramatura            NUMERIC(10,2) NOT NULL CHECK (gramatura > 0),
  quantity             NUMERIC(14,2) NOT NULL CHECK (quantity > 0),
  uses_full_sheet      BOOLEAN NOT NULL DEFAULT FALSE,
  outsourced_cut       BOOLEAN NOT NULL DEFAULT FALSE,
  is_first_purchase    BOOLEAN NOT NULL DEFAULT FALSE,
  cliche_cost          NUMERIC(14,2),
  cliche_price         NUMERIC(14,2),
  area                 NUMERIC(14,6) GENERATED ALWAYS AS (length * width) STORED,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (budget_id)
);

-- 2. Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  budget_id    TEXT NOT NULL REFERENCES public.budgets(id),
  status       TEXT NOT NULL DEFAULT 'production' CHECK (status IN ('production', 'partial', 'completed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
  id                 TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  order_id           TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  budget_item_id     TEXT,
  description        TEXT NOT NULL DEFAULT '',
  quantity_total     NUMERIC(14,2) NOT NULL CHECK (quantity_total > 0),
  quantity_produced  NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (quantity_produced >= 0),
  quantity_shipped   NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (quantity_shipped >= 0),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Shipments
CREATE TABLE IF NOT EXISTS public.shipments (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  order_id    TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  notes       TEXT,
  shipped_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Shipment Items
CREATE TABLE IF NOT EXISTS public.shipment_items (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  shipment_id     TEXT NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  order_item_id   TEXT NOT NULL REFERENCES public.order_items(id),
  quantity        NUMERIC(14,2) NOT NULL CHECK (quantity > 0)
);

-- 6. Accounts Receivable (Contas a Receber)
CREATE TABLE IF NOT EXISTS public.accounts_receivable (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  order_id     TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  amount       NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  due_date     DATE NOT NULL,
  paid_at      TIMESTAMPTZ,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  installment  INTEGER NOT NULL DEFAULT 1,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Extend production_orders with paperboard fields
ALTER TABLE public.production_orders
  ADD COLUMN IF NOT EXISTS production_type     TEXT CHECK (production_type IN ('corte', 'vinco')),
  ADD COLUMN IF NOT EXISTS production_location TEXT CHECK (production_location IN ('interno', 'terceirizado')),
  ADD COLUMN IF NOT EXISTS loss_percentage     NUMERIC(5,2) DEFAULT 0 CHECK (loss_percentage >= 0 AND loss_percentage <= 100),
  ADD COLUMN IF NOT EXISTS order_id            TEXT REFERENCES orders(id);

-- 8. Extend products with paperboard material fields
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_paperboard_material BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS gramatura              NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS sheets_per_bundle      INTEGER;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_budget_paperboard_configs_budget_id ON public.budget_paperboard_configs(budget_id);
CREATE INDEX IF NOT EXISTS idx_orders_budget_id ON public.orders(budget_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON public.shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipment_items_shipment_id ON public.shipment_items(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_items_order_item_id ON public.shipment_items(order_item_id);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_order_id ON public.accounts_receivable(order_id);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_due_date ON public.accounts_receivable(due_date);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_status ON public.accounts_receivable(status);
CREATE INDEX IF NOT EXISTS idx_production_orders_order_id ON public.production_orders(order_id);
