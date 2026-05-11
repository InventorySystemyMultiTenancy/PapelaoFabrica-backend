CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.production_orders
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
