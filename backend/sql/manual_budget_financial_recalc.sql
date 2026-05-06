-- Recalculo financeiro de orcamentos
-- Execute cada bloco separadamente no DBeaver.

-- ============================================================
-- BLOCO 1: PREVIEW (NAO ALTERA DADOS)
-- ============================================================
WITH material_totals AS (
  SELECT
    budget_id,
    COALESCE(SUM(quantity * COALESCE(unit_price, 0)), 0)::numeric AS material_cost
  FROM public.budget_materials
  GROUP BY budget_id
),
expense_totals AS (
  SELECT
    budget_id,
    COALESCE(SUM(amount), 0)::numeric AS expense_cost
  FROM public.budget_expense_departments
  GROUP BY budget_id
)
SELECT
  b.id,
  b.client_name,
  ROUND(COALESCE(mt.material_cost, 0), 2) AS novo_custo,
  ROUND(
    CASE
      WHEN COALESCE(b.profit_margin, 0) > 1 THEN b.profit_margin / 100.0
      ELSE COALESCE(b.profit_margin, 0)
    END,
    6
  ) AS margem_normalizada_decimal,
  ROUND(
    COALESCE(mt.material_cost, 0) *
    CASE
      WHEN COALESCE(b.profit_margin, 0) > 1 THEN b.profit_margin / 100.0
      ELSE COALESCE(b.profit_margin, 0)
    END,
    2
  ) AS novo_lucro,
  ROUND(
    COALESCE(mt.material_cost, 0) +
    (
      COALESCE(mt.material_cost, 0) *
      CASE
        WHEN COALESCE(b.profit_margin, 0) > 1 THEN b.profit_margin / 100.0
        ELSE COALESCE(b.profit_margin, 0)
      END
    ),
    2
  ) AS novo_preco_final,
  ROUND(COALESCE(b.labor_cost, 0) + COALESCE(et.expense_cost, 0), 2) AS novo_custos_aplicaveis
FROM public.budgets b
LEFT JOIN material_totals mt ON mt.budget_id = b.id
LEFT JOIN expense_totals et ON et.budget_id = b.id
ORDER BY b.created_at DESC;


-- ============================================================
-- BLOCO 2: APLICAR (ALTERA DADOS)
-- ============================================================
WITH material_totals AS (
  SELECT
    budget_id,
    COALESCE(SUM(quantity * COALESCE(unit_price, 0)), 0)::numeric AS material_cost
  FROM public.budget_materials
  GROUP BY budget_id
),
expense_totals AS (
  SELECT
    budget_id,
    COALESCE(SUM(amount), 0)::numeric AS expense_cost
  FROM public.budget_expense_departments
  GROUP BY budget_id
)
UPDATE public.budgets b
SET
  total_cost = ROUND(COALESCE(mt.material_cost, 0), 2),
  profit_margin = ROUND(
    CASE
      WHEN COALESCE(b.profit_margin, 0) > 1 THEN b.profit_margin / 100.0
      ELSE COALESCE(b.profit_margin, 0)
    END,
    6
  ),
  profit_value = ROUND(
    COALESCE(mt.material_cost, 0) *
    CASE
      WHEN COALESCE(b.profit_margin, 0) > 1 THEN b.profit_margin / 100.0
      ELSE COALESCE(b.profit_margin, 0)
    END,
    2
  ),
  total_price = ROUND(
    COALESCE(mt.material_cost, 0) +
    (
      COALESCE(mt.material_cost, 0) *
      CASE
        WHEN COALESCE(b.profit_margin, 0) > 1 THEN b.profit_margin / 100.0
        ELSE COALESCE(b.profit_margin, 0)
      END
    ),
    2
  ),
  costs_applicable_value = ROUND(
    COALESCE(b.costs_applicable_value, COALESCE(b.labor_cost, 0) + COALESCE(et.expense_cost, 0)),
    2
  ),
  updated_at = NOW()
FROM material_totals mt
LEFT JOIN expense_totals et ON et.budget_id = mt.budget_id
WHERE b.id = mt.budget_id;


-- ============================================================
-- BLOCO 3: VALIDAR (NAO ALTERA DADOS)
-- ============================================================
SELECT
  id,
  client_name,
  total_cost,
  costs_applicable_value,
  profit_margin,
  profit_value,
  total_price,
  updated_at
FROM public.budgets
ORDER BY updated_at DESC
LIMIT 50;
