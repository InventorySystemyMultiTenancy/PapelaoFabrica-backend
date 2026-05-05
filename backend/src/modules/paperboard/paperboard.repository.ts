import { randomUUID } from "node:crypto";
import { pool } from "../../database/postgres";
import {
  CreatePaperboardConfigInput,
  PaperboardConfig,
} from "./paperboard.schema";

interface PaperboardConfigRow {
  id: string;
  budget_id: string;
  length: string | number;
  width: string | number;
  height: string | number;
  gramatura: string | number;
  quantity: string | number;
  sheets_per_bundle: string | number | null;
  sheet_unit_cost: string | number | null;
  cutting_cost_per_kg: string | number | null;
  creasing_cost_per_kg: string | number | null;
  loss_percentage: string | number;
  markup_percentage: string | number;
  uses_full_sheet: boolean;
  outsourced_cut: boolean;
  is_first_purchase: boolean;
  cliche_cost: string | number | null;
  cliche_price: string | number | null;
  area: string | number;
  created_at: string | Date;
  updated_at: string | Date;
}

const MATERIAL_COST_FACTOR = 0.0042;
const DEFAULT_CUTTING_COST_PER_KG = 0.15;
const DEFAULT_CREASING_COST_PER_KG = 0.08;
const DEFAULT_MARKUP_PERCENTAGE = 35;

interface CostCalculationResult {
  packageArea: number;
  totalArea: number;
  totalSheets: number;
  totalBundles: number;
  materialCost: number;
  cuttingCost: number;
  creasingCost: number;
  lossCost: number;
  clicheAppliedCost: number;
  estimatedCost: number;
  suggestedPrice: number;
}

function calculateCosts(row: PaperboardConfigRow): CostCalculationResult {
  const length = Number(row.length);
  const width = Number(row.width);
  const height = Number(row.height);
  const gramatura = Number(row.gramatura);
  const quantity = Number(row.quantity);
  const area = Number(row.area);
  const sheetsPerBundle =
    row.sheets_per_bundle !== null ? Number(row.sheets_per_bundle) : null;
  const sheetUnitCost =
    row.sheet_unit_cost !== null ? Number(row.sheet_unit_cost) : null;
  const cuttingCostPerKg =
    row.cutting_cost_per_kg !== null
      ? Number(row.cutting_cost_per_kg)
      : DEFAULT_CUTTING_COST_PER_KG;
  const creasingCostPerKg =
    row.creasing_cost_per_kg !== null
      ? Number(row.creasing_cost_per_kg)
      : DEFAULT_CREASING_COST_PER_KG;
  const lossPercentage = Number(row.loss_percentage);
  const markupPercentage = Number(
    row.markup_percentage || DEFAULT_MARKUP_PERCENTAGE,
  );
  const clicheCost = row.cliche_cost !== null ? Number(row.cliche_cost) : 0;
  const clichePrice = row.cliche_price !== null ? Number(row.cliche_price) : 0;

  const packageArea = Math.max(
    (length * width + 2 * height * (length + width)) / 10000,
    area / 10000,
  );
  const lossFactor = row.uses_full_sheet ? 1 + lossPercentage / 100 : 1;
  const totalArea = packageArea * quantity * lossFactor;

  const sheetArea = Math.max(area / 10000, 0.0001);
  const totalSheets = Math.max(totalArea / sheetArea, 0);
  const totalBundles =
    sheetsPerBundle && sheetsPerBundle > 0
      ? Math.ceil(totalSheets / sheetsPerBundle)
      : 0;

  const baseMaterialCost = totalArea * gramatura * MATERIAL_COST_FACTOR;
  const materialCost =
    sheetUnitCost && sheetUnitCost > 0
      ? totalSheets * sheetUnitCost
      : baseMaterialCost;
  const cuttingCost = row.outsourced_cut ? quantity * cuttingCostPerKg : 0;
  const creasingCost = quantity * creasingCostPerKg;
  const lossCost = row.uses_full_sheet
    ? materialCost * (lossPercentage / 100)
    : 0;
  const clicheAppliedCost = row.is_first_purchase ? clicheCost : 0;

  const estimatedCost =
    materialCost + cuttingCost + creasingCost + lossCost + clicheAppliedCost;
  const suggestedPrice =
    estimatedCost * (1 + markupPercentage / 100) +
    (row.is_first_purchase ? clichePrice : 0);

  return {
    packageArea,
    totalArea,
    totalSheets,
    totalBundles,
    materialCost,
    cuttingCost,
    creasingCost,
    lossCost,
    clicheAppliedCost,
    estimatedCost,
    suggestedPrice,
  };
}

function rowToPaperboardConfig(row: PaperboardConfigRow): PaperboardConfig {
  const costs = calculateCosts(row);

  return {
    id: row.id,
    budgetId: row.budget_id,
    length: Number(row.length),
    width: Number(row.width),
    height: Number(row.height),
    gramatura: Number(row.gramatura),
    quantity: Number(row.quantity),
    sheetsPerBundle:
      row.sheets_per_bundle !== null ? Number(row.sheets_per_bundle) : null,
    sheetUnitCost:
      row.sheet_unit_cost !== null ? Number(row.sheet_unit_cost) : null,
    cuttingCostPerKg:
      row.cutting_cost_per_kg !== null ? Number(row.cutting_cost_per_kg) : null,
    creasingCostPerKg:
      row.creasing_cost_per_kg !== null
        ? Number(row.creasing_cost_per_kg)
        : null,
    lossPercentage: Number(row.loss_percentage),
    markupPercentage: Number(row.markup_percentage),
    usesFullSheet: row.uses_full_sheet,
    outsourcedCut: row.outsourced_cut,
    isFirstPurchase: row.is_first_purchase,
    clicheCost: row.cliche_cost !== null ? Number(row.cliche_cost) : null,
    clichePrice: row.cliche_price !== null ? Number(row.cliche_price) : null,
    area: Number(row.area),
    packageArea: costs.packageArea,
    totalArea: costs.totalArea,
    totalSheets: costs.totalSheets,
    totalBundles: costs.totalBundles,
    materialCost: costs.materialCost,
    cuttingCost: costs.cuttingCost,
    creasingCost: costs.creasingCost,
    lossCost: costs.lossCost,
    clicheAppliedCost: costs.clicheAppliedCost,
    estimatedCost: costs.estimatedCost,
    suggestedPrice: costs.suggestedPrice,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

async function findByBudgetId(
  budgetId: string,
): Promise<PaperboardConfig | null> {
  const result = await pool.query<PaperboardConfigRow>(
    `SELECT * FROM budget_paperboard_configs WHERE budget_id = $1`,
    [budgetId],
  );
  return result.rows[0] ? rowToPaperboardConfig(result.rows[0]) : null;
}

async function upsert(
  budgetId: string,
  input: CreatePaperboardConfigInput,
): Promise<PaperboardConfig> {
  const id = randomUUID();
  const result = await pool.query<PaperboardConfigRow>(
    `INSERT INTO budget_paperboard_configs (
       id, budget_id, length, width, height, gramatura, quantity,
       sheets_per_bundle, sheet_unit_cost, cutting_cost_per_kg, creasing_cost_per_kg,
       loss_percentage, markup_percentage,
       uses_full_sheet, outsourced_cut, is_first_purchase,
       cliche_cost, cliche_price, updated_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,NOW())
     ON CONFLICT (budget_id) DO UPDATE SET
       length           = EXCLUDED.length,
       width            = EXCLUDED.width,
       height           = EXCLUDED.height,
       gramatura        = EXCLUDED.gramatura,
       quantity         = EXCLUDED.quantity,
       sheets_per_bundle = EXCLUDED.sheets_per_bundle,
       sheet_unit_cost = EXCLUDED.sheet_unit_cost,
       cutting_cost_per_kg = EXCLUDED.cutting_cost_per_kg,
       creasing_cost_per_kg = EXCLUDED.creasing_cost_per_kg,
       loss_percentage  = EXCLUDED.loss_percentage,
       markup_percentage = EXCLUDED.markup_percentage,
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
      input.sheetsPerBundle ?? null,
      input.sheetUnitCost ?? null,
      input.cuttingCostPerKg ?? null,
      input.creasingCostPerKg ?? null,
      input.lossPercentage ?? 0,
      input.markupPercentage ?? DEFAULT_MARKUP_PERCENTAGE,
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
  await pool.query(
    `DELETE FROM budget_paperboard_configs WHERE budget_id = $1`,
    [budgetId],
  );
}

export const paperboardRepository = { findByBudgetId, upsert, remove };
