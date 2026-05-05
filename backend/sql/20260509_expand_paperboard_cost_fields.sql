ALTER TABLE public.budget_paperboard_configs
  ADD COLUMN IF NOT EXISTS sheets_per_bundle NUMERIC(14,3),
  ADD COLUMN IF NOT EXISTS sheet_unit_cost NUMERIC(14,4),
  ADD COLUMN IF NOT EXISTS cutting_cost_per_kg NUMERIC(14,4),
  ADD COLUMN IF NOT EXISTS creasing_cost_per_kg NUMERIC(14,4),
  ADD COLUMN IF NOT EXISTS loss_percentage NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (loss_percentage >= 0 AND loss_percentage <= 100),
  ADD COLUMN IF NOT EXISTS markup_percentage NUMERIC(5,2) NOT NULL DEFAULT 35 CHECK (markup_percentage >= 0);
