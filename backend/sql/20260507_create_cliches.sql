-- Controle de Clichês por Cliente
CREATE TABLE IF NOT EXISTS cliches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  colors INTEGER NOT NULL DEFAULT 1,
  width_cm NUMERIC(10,2),
  height_cm NUMERIC(10,2),
  cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid BOOLEAN NOT NULL DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cliches_client_id ON cliches(client_id);
CREATE INDEX IF NOT EXISTS idx_cliches_paid ON cliches(paid);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cliches'
      AND column_name = 'client_id'
      AND udt_name = 'uuid'
  ) THEN
    ALTER TABLE public.cliches
      DROP CONSTRAINT IF EXISTS cliches_client_id_fkey;

    ALTER TABLE public.cliches
      ALTER COLUMN client_id TYPE TEXT USING client_id::text;

    ALTER TABLE public.cliches
      ADD CONSTRAINT cliches_client_id_fkey
      FOREIGN KEY (client_id)
      REFERENCES public.clients(id)
      ON DELETE CASCADE;
  END IF;
END $$;
