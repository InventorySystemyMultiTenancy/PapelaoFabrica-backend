import { randomUUID } from "node:crypto";
import { pool } from "../../database/postgres";
import { CreatePaperboardConfigInput, PaperboardConfig } from "./paperboard.schema";

interface PaperboardConfigRow {
  id: string;
  budget_id: string;
  length: string | number;
  width: string | number;
  height: string | number;
  gramatura: string | number;
  quantity: string | number;
  uses_full_sheet: boolean;
  outsourced_cut: boolean;
  is_first_purchase: boolean;
  cliche_cost: string | number | null;
  cliche_price: string | number | null;
  area: string | number;
  created_at: string | Date;
  updated_at: string | Date;
}

const MATERIAL_COST_FACTOR = 0.000001; // fator de custo por gramatura (ajustável)

function rowToPaperboardConfig(row: PaperboardConfigRow): PaperboardConfig {
  const length = Number(row.length);
  const width = Number(row.width);
  const gramatura = Number(row.gramatura);
  const quantity = Number(row.quantity);
  const area = Number(row.area);
  const clicheCost = row.cliche_cost !== null ? Number(row.cliche_cost) : null;

  const baseCost = area * gramatura * MATERIAL_COST_FACTOR * quantity;
  const estimatedCost = baseCost + (clicheCost ?? 0);

  return {
    id: row.id,
    budgetId: row.budget_id,
    length,
    width,
    height: Number(row.height),
    gramatura,
    quantity,
    usesFullSheet: row.uses_full_sheet,
    outsourcedCut: row.outsourced_cut,
    isFirstPurchase: row.is_first_purchase,
    clicheCost,
    clichePrice: row.cliche_price !== null ? Number(row.cliche_price) : null,
    area,
    estimatedCost,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

async function findByBudgetId(budgetId: string): Promise<PaperboardConfig | null> {
  const result = await pool.query<PaperboardConfigRow>(
    `SELECT * FROM budget_paperboard_configs WHERE budget_id = $1`,
    [budgetId],
  );
  return result.rows[0] ? rowToPaperboardConfig(result.rows[0]) : null;
}

async function upsert(budgetId: string, input: CreatePaperboardConfigInput): Promise<PaperboardConfig> {
  const id = randomUUID();
  const result = await pool.query<PaperboardConfigRow>(
    `INSERT INTO budget_paperboard_configs (
       id, budget_id, length, width, height, gramatura, quantity,
       uses_full_sheet, outsourced_cut, is_first_purchase,
       cliche_cost, cliche_price, updated_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
     ON CONFLICT (budget_id) DO UPDATE SET
       length           = EXCLUDED.length,
       width            = EXCLUDED.width,
       height           = EXCLUDED.height,
       gramatura        = EXCLUDED.gramatura,
       quantity         = EXCLUDED.quantity,
       uses_full_sheet  = EXCLUDED.uses_full_sheet,
       outsourced_cut   = EXCLUDED.outsourced_cut,
       is_first_purchase = EXCLUDED.is_first_purchase,
       cliche_cost      = EXCLUDED.cliche_cost,
       cliche_price     = EXCLUDED.cliche_price,
       updated_at       = NOW()
     RETURNING *`,
    [
      id,
      budgetId,
      input.length,
      input.width,
      input.height,
      input.gramatura,
      input.quantity,
      input.usesFullSheet,
      input.outsourcedCut,
      input.isFirstPurchase,
      input.clicheCost ?? null,
      input.clichePrice ?? null,
    ],
  );
  return rowToPaperboardConfig(result.rows[0]);
}

async function remove(budgetId: string): Promise<void> {
  await pool.query(`DELETE FROM budget_paperboard_configs WHERE budget_id = $1`, [budgetId]);
}

export const paperboardRepository = { findByBudgetId, upsert, remove };
