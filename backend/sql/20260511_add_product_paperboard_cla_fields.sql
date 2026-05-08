ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_paperboard_material BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS length                 NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS width                  NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS height                 NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS quality                VARCHAR(10),
  ADD COLUMN IF NOT EXISTS gramatura              NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS sheets_per_bundle      INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'products'
      AND constraint_name = 'chk_products_paperboard_quality'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT chk_products_paperboard_quality
      CHECK (quality IS NULL OR quality IN ('CMCB', 'CMCBC'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'products'
      AND constraint_name = 'chk_products_paperboard_length_positive'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT chk_products_paperboard_length_positive
      CHECK (length IS NULL OR length > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'products'
      AND constraint_name = 'chk_products_paperboard_width_positive'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT chk_products_paperboard_width_positive
      CHECK (width IS NULL OR width > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'products'
      AND constraint_name = 'chk_products_paperboard_height_positive'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT chk_products_paperboard_height_positive
      CHECK (height IS NULL OR height > 0);
  END IF;
END $$;
