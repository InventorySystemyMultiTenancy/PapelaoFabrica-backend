-- === 20260318_create_clients.sql ===
CREATE TABLE IF NOT EXISTS public.clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  company_name TEXT,
  document TEXT,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  secondary_phone TEXT,
  street TEXT,
  number TEXT,
  complement TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS name TEXT;

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS company_name TEXT;

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS document TEXT;

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS contact_name TEXT;

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS secondary_phone TEXT;

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS street TEXT;

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS number TEXT;

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS complement TEXT;

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS neighborhood TEXT;

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS city TEXT;

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS state TEXT;

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS postal_code TEXT;

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE public.clients
SET metadata = '{}'::jsonb
WHERE metadata IS NULL;

UPDATE public.clients
SET name = COALESCE(NULLIF(BTRIM(name), ''), NULLIF(BTRIM(company_name), ''), 'Cliente sem nome')
WHERE name IS NULL OR BTRIM(name) = '';

ALTER TABLE public.clients
ALTER COLUMN name SET NOT NULL;

ALTER TABLE public.clients
ALTER COLUMN metadata SET DEFAULT '{}'::jsonb;

ALTER TABLE public.clients
ALTER COLUMN metadata SET NOT NULL;

ALTER TABLE public.clients
ALTER COLUMN is_active SET DEFAULT TRUE;

ALTER TABLE public.clients
ALTER COLUMN is_active SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_email_unique
ON public.clients (LOWER(email))
WHERE email IS NOT NULL AND BTRIM(email) <> '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_document_unique
ON public.clients (LOWER(document))
WHERE document IS NOT NULL AND BTRIM(document) <> '';

CREATE INDEX IF NOT EXISTS idx_clients_name
ON public.clients (LOWER(name));

CREATE INDEX IF NOT EXISTS idx_clients_is_active
ON public.clients (is_active);

CREATE INDEX IF NOT EXISTS idx_clients_created_at
ON public.clients (created_at DESC);


-- === 20260318_create_production_images.sql ===
-- Production images persistence
-- Run this script in PostgreSQL (DBeaver) to store production images in database.

CREATE TABLE IF NOT EXISTS public.production_images (
  id TEXT PRIMARY KEY,
  production_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  image_data BYTEA NOT NULL,
  created_by_user_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'idx_production_images_production_id'
  ) THEN
    CREATE INDEX idx_production_images_production_id
      ON public.production_images (production_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'idx_production_images_created_at'
  ) THEN
    CREATE INDEX idx_production_images_created_at
      ON public.production_images (created_at DESC);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'production_images'
      AND constraint_name = 'chk_production_images_file_size_positive'
  ) THEN
    ALTER TABLE public.production_images
      ADD CONSTRAINT chk_production_images_file_size_positive
      CHECK (file_size > 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'production_images'
      AND constraint_name = 'chk_production_images_mime_type_image'
  ) THEN
    ALTER TABLE public.production_images
      ADD CONSTRAINT chk_production_images_mime_type_image
      CHECK (mime_type LIKE 'image/%');
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'employees'
      AND column_name = 'id'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'production_images'
      AND constraint_name = 'fk_production_images_created_by_user'
  ) THEN
    ALTER TABLE public.production_images
      ADD CONSTRAINT fk_production_images_created_by_user
      FOREIGN KEY (created_by_user_id)
      REFERENCES public.employees(id)
      ON DELETE SET NULL;
  END IF;
END $$;


-- === 20260318_create_production_share_links.sql ===
-- Public production share links
-- Run this script in PostgreSQL (DBeaver) to enable token-based public tracking URLs.

CREATE TABLE IF NOT EXISTS public.production_share_links (
  id TEXT PRIMARY KEY,
  production_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  created_by_user_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'ux_production_share_links_token_hash'
  ) THEN
    CREATE UNIQUE INDEX ux_production_share_links_token_hash
      ON public.production_share_links (token_hash);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'idx_production_share_links_production_id'
  ) THEN
    CREATE INDEX idx_production_share_links_production_id
      ON public.production_share_links (production_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'idx_production_share_links_active'
  ) THEN
    CREATE INDEX idx_production_share_links_active
      ON public.production_share_links (production_id, revoked_at, expires_at);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'employees'
      AND column_name = 'id'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'production_share_links'
      AND constraint_name = 'fk_production_share_links_created_by_user'
  ) THEN
    ALTER TABLE public.production_share_links
      ADD CONSTRAINT fk_production_share_links_created_by_user
      FOREIGN KEY (created_by_user_id)
      REFERENCES public.employees(id)
      ON DELETE SET NULL;
  END IF;
END $$;


-- === 20260318_expand_production_status_flow.sql ===
DO $$
DECLARE
  existing_constraint_name text;
BEGIN
  FOR existing_constraint_name IN
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
     AND ccu.constraint_schema = tc.constraint_schema
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'production_orders'
      AND tc.constraint_type = 'CHECK'
      AND ccu.column_name = 'production_status'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.production_orders DROP CONSTRAINT %I',
      existing_constraint_name
    );
  END LOOP;
END $$;

DO $$
DECLARE
  production_status_type text;
BEGIN
  SELECT
    pg_catalog.format_type(a.atttypid, a.atttypmod)
  INTO
    production_status_type
  FROM pg_attribute a
  JOIN pg_class c
    ON c.oid = a.attrelid
  JOIN pg_namespace n
    ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'production_orders'
    AND a.attname = 'production_status'
    AND a.attnum > 0
    AND NOT a.attisdropped
  LIMIT 1;

  IF production_status_type IS NULL THEN
    RAISE EXCEPTION 'Column public.production_orders.production_status not found';
  END IF;

  IF production_status_type <> 'text' THEN
    ALTER TABLE public.production_orders
      ALTER COLUMN production_status DROP DEFAULT;

    ALTER TABLE public.production_orders
      ALTER COLUMN production_status TYPE TEXT
      USING production_status::text;

    ALTER TABLE public.production_orders
      ALTER COLUMN production_status SET DEFAULT 'pending';
  END IF;
END $$;

UPDATE public.production_orders
SET production_status = CASE
  WHEN LOWER(BTRIM(production_status::text)) IN ('pending', 'pendente') THEN 'pending'
  WHEN LOWER(BTRIM(production_status::text)) IN ('cutting', 'corte') THEN 'cutting'
  WHEN LOWER(BTRIM(production_status::text)) IN ('assembly', 'montagem') THEN 'assembly'
  WHEN LOWER(BTRIM(production_status::text)) IN ('finishing', 'acabamento') THEN 'finishing'
  WHEN LOWER(BTRIM(production_status::text)) IN ('controle', 'quality_check', 'quality check') THEN 'quality_check'
  WHEN LOWER(BTRIM(production_status::text)) IN ('approved', 'aprovado') THEN 'approved'
  WHEN LOWER(BTRIM(production_status::text)) IN ('delivered', 'entregue', 'concluido', 'concluida', 'completed') THEN 'delivered'
  ELSE 'pending'
END;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
     AND ccu.constraint_schema = tc.constraint_schema
    WHERE tc.constraint_schema = 'public'
      AND tc.table_name = 'production_orders'
      AND tc.constraint_name = 'chk_production_orders_status'
  ) THEN
    ALTER TABLE public.production_orders
      ADD CONSTRAINT chk_production_orders_status
      CHECK (
        production_status::text IN (
          'pending',
          'cutting',
          'assembly',
          'finishing',
          'quality_check',
          'approved',
          'delivered'
        )
      );
  END IF;
END $$;


-- === 20260319_add_budget_financials_and_production_material_unit_price.sql ===
ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS total_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profit_margin NUMERIC(10,6) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profit_value NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS labor_cost NUMERIC(14,2) NOT NULL DEFAULT 0;

ALTER TABLE public.budgets
  DROP CONSTRAINT IF EXISTS chk_budgets_total_cost_nonnegative,
  ADD CONSTRAINT chk_budgets_total_cost_nonnegative
    CHECK (total_cost >= 0),
  DROP CONSTRAINT IF EXISTS chk_budgets_profit_margin_range,
  ADD CONSTRAINT chk_budgets_profit_margin_range
    CHECK (profit_margin >= 0 AND profit_margin <= 1),
  DROP CONSTRAINT IF EXISTS chk_budgets_profit_value_nonnegative,
  ADD CONSTRAINT chk_budgets_profit_value_nonnegative
    CHECK (profit_value >= 0),
  DROP CONSTRAINT IF EXISTS chk_budgets_labor_cost_nonnegative,
  ADD CONSTRAINT chk_budgets_labor_cost_nonnegative
    CHECK (labor_cost >= 0);

ALTER TABLE public.budget_materials
  ADD COLUMN IF NOT EXISTS unit_price NUMERIC(14,2);

ALTER TABLE public.budget_materials
  DROP CONSTRAINT IF EXISTS chk_budget_materials_unit_price_nonnegative,
  ADD CONSTRAINT chk_budget_materials_unit_price_nonnegative
    CHECK (unit_price IS NULL OR unit_price >= 0);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'production_order_materials'
  ) THEN
    EXECUTE '
      ALTER TABLE public.production_order_materials
      ADD COLUMN IF NOT EXISTS unit_price NUMERIC(14,2)
    ';

    EXECUTE '
      UPDATE public.production_order_materials
      SET unit_price = 0
      WHERE unit_price IS NULL
    ';

    EXECUTE '
      ALTER TABLE public.production_order_materials
      ALTER COLUMN unit_price SET DEFAULT 0
    ';

    EXECUTE '
      ALTER TABLE public.production_order_materials
      DROP CONSTRAINT IF EXISTS chk_production_order_materials_unit_price_nonnegative
    ';

    EXECUTE '
      ALTER TABLE public.production_order_materials
      ADD CONSTRAINT chk_production_order_materials_unit_price_nonnegative
      CHECK (unit_price >= 0)
    ';
  END IF;
END
$$;


-- === 20260331_add_budget_category.sql ===
ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'executivo';

ALTER TABLE public.budgets
  DROP CONSTRAINT IF EXISTS chk_budgets_category,
  ADD CONSTRAINT chk_budgets_category
    CHECK (category IN ('arquitetonico', 'executivo'));

CREATE INDEX IF NOT EXISTS idx_budgets_category
ON public.budgets (category);


-- === 20260331_add_budget_costs_applicable_value.sql ===
ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS costs_applicable_value NUMERIC(14,2) NOT NULL DEFAULT 0;

ALTER TABLE public.budgets
  DROP CONSTRAINT IF EXISTS chk_budgets_costs_applicable_value_nonnegative,
  ADD CONSTRAINT chk_budgets_costs_applicable_value_nonnegative
    CHECK (costs_applicable_value >= 0);

UPDATE public.budgets
SET costs_applicable_value = GREATEST(COALESCE(total_cost, 0), 0)
WHERE costs_applicable_value IS NULL OR costs_applicable_value = 0;

UPDATE public.budgets
SET costs_applied_value = GREATEST(COALESCE(costs_applicable_value, 0), 0)
WHERE status IN ('pre_approved', 'approved');


-- === 20260331_add_budget_expense_departments.sql ===
CREATE TABLE IF NOT EXISTS public.expense_departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sector TEXT NOT NULL,
  default_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_expense_departments_default_amount_nonnegative
    CHECK (default_amount >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_expense_departments_name_sector
ON public.expense_departments (LOWER(BTRIM(name)), LOWER(BTRIM(sector)));

CREATE INDEX IF NOT EXISTS idx_expense_departments_sector
ON public.expense_departments (sector);

CREATE TABLE IF NOT EXISTS public.budget_expense_departments (
  id BIGSERIAL PRIMARY KEY,
  budget_id TEXT NOT NULL,
  expense_department_id TEXT,
  department_name TEXT NOT NULL,
  sector TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_budget_expense_departments_budget
    FOREIGN KEY (budget_id)
    REFERENCES public.budgets(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_budget_expense_departments_catalog
    FOREIGN KEY (expense_department_id)
    REFERENCES public.expense_departments(id)
    ON DELETE SET NULL,
  CONSTRAINT chk_budget_expense_departments_amount_nonnegative
    CHECK (amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_budget_expense_departments_budget_id
ON public.budget_expense_departments (budget_id);

CREATE INDEX IF NOT EXISTS idx_budget_expense_departments_catalog_id
ON public.budget_expense_departments (expense_department_id);


-- === 20260331_add_budget_pre_approved_status_and_cost_application.sql ===
ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS costs_applicable_value NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS costs_applied_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS costs_applied_value NUMERIC(14,2) NOT NULL DEFAULT 0;

ALTER TABLE public.budgets
  DROP CONSTRAINT IF EXISTS chk_budgets_status,
  ADD CONSTRAINT chk_budgets_status
    CHECK (status IN ('draft', 'pending', 'pre_approved', 'approved', 'rejected')),
  DROP CONSTRAINT IF EXISTS chk_budgets_costs_applicable_value_nonnegative,
  ADD CONSTRAINT chk_budgets_costs_applicable_value_nonnegative
    CHECK (costs_applicable_value >= 0),
  DROP CONSTRAINT IF EXISTS chk_budgets_costs_applied_value_nonnegative,
  ADD CONSTRAINT chk_budgets_costs_applied_value_nonnegative
    CHECK (costs_applied_value >= 0);

UPDATE public.budgets
SET costs_applicable_value = GREATEST(COALESCE(total_cost, 0), 0)
WHERE costs_applicable_value IS NULL OR costs_applicable_value = 0;

UPDATE public.budgets
SET
  costs_applied_at = COALESCE(costs_applied_at, approved_at, NOW()),
  costs_applied_value = GREATEST(COALESCE(costs_applicable_value, 0), 0)
WHERE status IN ('pre_approved', 'approved');


-- === 20260401_add_team_category.sql ===
-- Add team category (interna | terceirizada)
-- Run this script in PostgreSQL (DBeaver).

ALTER TABLE public.teams
ADD COLUMN IF NOT EXISTS category TEXT;

UPDATE public.teams
SET category = 'interna'
WHERE category IS NULL OR BTRIM(category) = '';

ALTER TABLE public.teams
ALTER COLUMN category SET NOT NULL;

ALTER TABLE public.teams
ALTER COLUMN category SET DEFAULT 'interna';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'teams'
      AND constraint_name = 'chk_teams_category'
  ) THEN
    ALTER TABLE public.teams
      ADD CONSTRAINT chk_teams_category
      CHECK (category IN ('interna', 'terceirizada'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_teams_category
ON public.teams (category);


-- === 20260401_create_production_multi_statuses.sql ===
-- Multi-status workflow for production orders
-- Allows multiple editable stages per production, each with a responsible team.

CREATE TABLE IF NOT EXISTS public.production_status_stages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_production_status_stages_normalized_name
ON public.production_status_stages (normalized_name);

CREATE TABLE IF NOT EXISTS public.production_order_statuses (
  id TEXT PRIMARY KEY,
  production_id TEXT NOT NULL,
  stage_id TEXT NOT NULL,
  team_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_production_order_statuses_unique_link
ON public.production_order_statuses (production_id, stage_id, team_id);

CREATE INDEX IF NOT EXISTS idx_production_order_statuses_production_id
ON public.production_order_statuses (production_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_production_order_statuses_stage_id
ON public.production_order_statuses (stage_id);

CREATE INDEX IF NOT EXISTS idx_production_order_statuses_team_id
ON public.production_order_statuses (team_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'production_order_statuses'
      AND constraint_name = 'fk_production_order_statuses_stage'
  ) THEN
    ALTER TABLE public.production_order_statuses
      ADD CONSTRAINT fk_production_order_statuses_stage
      FOREIGN KEY (stage_id)
      REFERENCES public.production_status_stages(id)
      ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'production_order_statuses'
      AND constraint_name = 'fk_production_order_statuses_team'
  ) THEN
    ALTER TABLE public.production_order_statuses
      ADD CONSTRAINT fk_production_order_statuses_team
      FOREIGN KEY (team_id)
      REFERENCES public.teams(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Remove legacy strict constraint so production_orders.production_status can store free text if needed.
DO $$
DECLARE
  existing_constraint_name text;
BEGIN
  FOR existing_constraint_name IN
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.constraint_schema = tc.constraint_schema
    WHERE tc.constraint_schema = 'public'
      AND tc.table_name = 'production_orders'
      AND tc.constraint_type = 'CHECK'
      AND ccu.column_name = 'production_status'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.production_orders DROP CONSTRAINT %I',
      existing_constraint_name
    );
  END LOOP;
END $$;

-- Seed common stages.
INSERT INTO public.production_status_stages (id, name, normalized_name)
SELECT md5(random()::text || clock_timestamp()::text), seeded.name, seeded.normalized_name
FROM (
  VALUES
    ('Pendente', 'pendente'),
    ('Corte', 'corte'),
    ('Montagem', 'montagem'),
    ('Acabamento', 'acabamento'),
    ('Controle', 'controle'),
    ('Aprovado', 'aprovado'),
    ('Entregue', 'entregue')
) AS seeded(name, normalized_name)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.production_status_stages pss
  WHERE pss.normalized_name = seeded.normalized_name
);

-- Backfill one status assignment per production when none exists yet.
WITH resolved_source AS (
  SELECT
    po.id::text AS production_id,
    CASE
      WHEN LOWER(BTRIM(po.production_status::text)) IN ('pending', 'pendente') THEN 'pendente'
      WHEN LOWER(BTRIM(po.production_status::text)) IN ('cutting', 'corte') THEN 'corte'
      WHEN LOWER(BTRIM(po.production_status::text)) IN ('assembly', 'montagem') THEN 'montagem'
      WHEN LOWER(BTRIM(po.production_status::text)) IN ('finishing', 'acabamento') THEN 'acabamento'
      WHEN LOWER(BTRIM(po.production_status::text)) IN ('quality_check', 'quality check', 'controle') THEN 'controle'
      WHEN LOWER(BTRIM(po.production_status::text)) IN ('approved', 'aprovado') THEN 'aprovado'
      WHEN LOWER(BTRIM(po.production_status::text)) IN ('delivered', 'entregue', 'completed', 'concluido', 'concluida') THEN 'entregue'
      WHEN po.production_status IS NULL OR BTRIM(po.production_status::text) = '' THEN 'pendente'
      ELSE LOWER(BTRIM(po.production_status::text))
    END AS normalized_stage,
    po.production_status::text AS original_stage,
    po.installation_team_id
  FROM public.production_orders po
),
seed_custom_stages AS (
  INSERT INTO public.production_status_stages (id, name, normalized_name)
  SELECT
    md5(random()::text || clock_timestamp()::text || rs.normalized_stage),
    CASE
      WHEN rs.original_stage IS NULL OR BTRIM(rs.original_stage) = '' THEN rs.normalized_stage
      ELSE BTRIM(rs.original_stage)
    END,
    rs.normalized_stage
  FROM resolved_source rs
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.production_status_stages pss
    WHERE pss.normalized_name = rs.normalized_stage
  )
  GROUP BY rs.normalized_stage, rs.original_stage
)
INSERT INTO public.production_order_statuses (id, production_id, stage_id, team_id)
SELECT
  md5(random()::text || clock_timestamp()::text || rs.production_id || pss.id),
  rs.production_id,
  pss.id,
  rs.installation_team_id
FROM resolved_source rs
INNER JOIN public.production_status_stages pss
  ON pss.normalized_name = rs.normalized_stage
WHERE NOT EXISTS (
  SELECT 1
  FROM public.production_order_statuses pos
  WHERE pos.production_id = rs.production_id
);

-- === 20260407_create_fechamento.sql ===
-- Fechamento mensal da logistica
-- Execute este script no PostgreSQL via DBeaver.

CREATE TABLE IF NOT EXISTS public.fechamento (
  id TEXT PRIMARY KEY,
  reference_month DATE NOT NULL,
  custo_geral_ativo NUMERIC(14,2) NOT NULL DEFAULT 0,
  receita_vinculada NUMERIC(14,2) NOT NULL DEFAULT 0,
  lucro_liquido NUMERIC(14,2) NOT NULL DEFAULT 0,
  lucro_bruto NUMERIC(14,2) NOT NULL DEFAULT 0,
  custos_aplicados_pre_aprovados NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_fechamento_custo_geral_ativo_non_negative
    CHECK (custo_geral_ativo >= 0),
  CONSTRAINT chk_fechamento_receita_vinculada_non_negative
    CHECK (receita_vinculada >= 0),
  CONSTRAINT chk_fechamento_custos_aplicados_pre_aprovados_non_negative
    CHECK (custos_aplicados_pre_aprovados >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_fechamento_reference_month
ON public.fechamento (reference_month);

CREATE INDEX IF NOT EXISTS idx_fechamento_reference_month_desc
ON public.fechamento (reference_month DESC);


-- === 20260414_add_budget_estimated_delivery_business_days.sql ===
ALTER TABLE public.budgets
ADD COLUMN IF NOT EXISTS estimated_delivery_business_days INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_budgets_estimated_delivery_business_days_positive'
      AND conrelid = 'public.budgets'::regclass
  ) THEN
    ALTER TABLE public.budgets
    ADD CONSTRAINT chk_budgets_estimated_delivery_business_days_positive
    CHECK (
      estimated_delivery_business_days IS NULL
      OR estimated_delivery_business_days > 0
    );
  END IF;
END $$;

-- Optional transition backfill:
-- UPDATE public.budgets
-- SET estimated_delivery_business_days = 60
-- WHERE estimated_delivery_business_days IS NULL
--   AND delivery_date IS NOT NULL;


-- === 20260414_add_budget_lifecycle_indexes.sql ===
CREATE INDEX IF NOT EXISTS idx_budgets_status_created_at
ON public.budgets (status, created_at);

CREATE INDEX IF NOT EXISTS idx_budgets_status_updated_at
ON public.budgets (status, updated_at);


-- === 20260414_add_budget_payment_terms.sql ===
ALTER TABLE public.budgets
ADD COLUMN IF NOT EXISTS payment_terms TEXT;

-- Optional transition backfill:
-- UPDATE public.budgets
-- SET payment_terms = 'Pagamento: 50% fechamento e assinatura de contrato 50% restante a serem pagos 30 dias apos inicio da obra.\nPrazo previsto para entrega: 60 dias. Proposta valida por 5 dias.'
-- WHERE payment_terms IS NULL;


-- === 20260505_create_paperboard_modules.sql ===
-- ============================================================
-- Paperboard Factory Modules
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Budget Paperboard Config (extends budgets)
CREATE TABLE IF NOT EXISTS public.budget_paperboard_configs (
  id                   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  budget_id            TEXT NOT NULL,
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
  budget_id    TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'production' CHECK (status IN ('production', 'partial', 'completed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
  id                 TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  order_id           TEXT NOT NULL,
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
  order_id    TEXT NOT NULL,
  notes       TEXT,
  shipped_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Shipment Items
CREATE TABLE IF NOT EXISTS public.shipment_items (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  shipment_id     TEXT NOT NULL,
  order_item_id   TEXT NOT NULL,
  quantity        NUMERIC(14,2) NOT NULL CHECK (quantity > 0)
);

-- 6. Accounts Receivable (Contas a Receber)
CREATE TABLE IF NOT EXISTS public.accounts_receivable (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  order_id     TEXT NOT NULL,
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
  ADD COLUMN IF NOT EXISTS order_id            TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'orders'
  )
  AND EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'budgets'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'budget_paperboard_configs'
      AND constraint_name = 'fk_budget_paperboard_configs_budget'
  ) THEN
    ALTER TABLE public.budget_paperboard_configs
      ADD CONSTRAINT fk_budget_paperboard_configs_budget
      FOREIGN KEY (budget_id)
      REFERENCES public.budgets(id)
      ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'orders'
  )
  AND EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'budgets'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'orders'
      AND constraint_name = 'fk_orders_budget'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT fk_orders_budget
      FOREIGN KEY (budget_id)
      REFERENCES public.budgets(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'order_items'
  )
  AND EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'orders'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'order_items'
      AND constraint_name = 'fk_order_items_order'
  ) THEN
    ALTER TABLE public.order_items
      ADD CONSTRAINT fk_order_items_order
      FOREIGN KEY (order_id)
      REFERENCES public.orders(id)
      ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'shipments'
  )
  AND EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'orders'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'shipments'
      AND constraint_name = 'fk_shipments_order'
  ) THEN
    ALTER TABLE public.shipments
      ADD CONSTRAINT fk_shipments_order
      FOREIGN KEY (order_id)
      REFERENCES public.orders(id)
      ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'shipment_items'
  )
  AND EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'shipments'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'shipment_items'
      AND constraint_name = 'fk_shipment_items_shipment'
  ) THEN
    ALTER TABLE public.shipment_items
      ADD CONSTRAINT fk_shipment_items_shipment
      FOREIGN KEY (shipment_id)
      REFERENCES public.shipments(id)
      ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'shipment_items'
  )
  AND EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'order_items'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'shipment_items'
      AND constraint_name = 'fk_shipment_items_order_item'
  ) THEN
    ALTER TABLE public.shipment_items
      ADD CONSTRAINT fk_shipment_items_order_item
      FOREIGN KEY (order_item_id)
      REFERENCES public.order_items(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'accounts_receivable'
  )
  AND EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'orders'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'accounts_receivable'
      AND constraint_name = 'fk_accounts_receivable_order'
  ) THEN
    ALTER TABLE public.accounts_receivable
      ADD CONSTRAINT fk_accounts_receivable_order
      FOREIGN KEY (order_id)
      REFERENCES public.orders(id)
      ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'production_orders'
  )
  AND EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'orders'
  )
  AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'production_orders'
      AND column_name = 'order_id'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'production_orders'
      AND constraint_name = 'fk_production_orders_order'
  ) THEN
    ALTER TABLE public.production_orders
      ADD CONSTRAINT fk_production_orders_order
      FOREIGN KEY (order_id)
      REFERENCES public.orders(id)
      ON DELETE SET NULL;
  END IF;
END $$;

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


-- === 20260506_seed_admin_4dpapelao.sql ===
-- Seed admin user for 4D Papelao
-- email: admin@4dpapelao.com
-- password: 1234567

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.employees
    WHERE LOWER(email) = LOWER('admin@4dpapelao.com')
  ) THEN
    UPDATE public.employees
    SET
      name = 'Administrador 4D',
      role = 'admin',
      password_hash = '$2b$10$N0yvqz3KjhLwUnGtKIqjmO1c8UG/TgNQPCl6J4/sEU/bbPrXbUEPC',
      is_active = TRUE,
      updated_at = NOW()
    WHERE LOWER(email) = LOWER('admin@4dpapelao.com');
  ELSE
    INSERT INTO public.employees (id, name, email, role, password_hash, is_active)
    VALUES (
      'emp-admin-4dpapelao',
      'Administrador 4D',
      'admin@4dpapelao.com',
      'admin',
      '$2b$10$N0yvqz3KjhLwUnGtKIqjmO1c8UG/TgNQPCl6J4/sEU/bbPrXbUEPC',
      TRUE
    );
  END IF;
END $$;


