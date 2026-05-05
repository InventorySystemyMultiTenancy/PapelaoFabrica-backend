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
