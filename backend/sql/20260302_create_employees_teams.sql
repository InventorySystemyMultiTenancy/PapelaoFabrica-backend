-- Cria tabelas de employees, teams e team_members caso ainda não existam.
-- Este script é idempotente (usa IF NOT EXISTS em tudo).

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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'idx_employees_email_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_employees_email_unique
      ON public.employees (LOWER(email))
      WHERE email IS NOT NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'interna',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'idx_teams_name_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_teams_name_unique
      ON public.teams (LOWER(name));
  END IF;
END $$;

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
