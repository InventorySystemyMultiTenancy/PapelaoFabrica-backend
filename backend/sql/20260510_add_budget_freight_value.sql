ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS freight_value NUMERIC(14,2) NOT NULL DEFAULT 0;

ALTER TABLE public.budgets
  DROP CONSTRAINT IF EXISTS chk_budgets_freight_value_nonnegative,
  ADD CONSTRAINT chk_budgets_freight_value_nonnegative
    CHECK (freight_value >= 0);
