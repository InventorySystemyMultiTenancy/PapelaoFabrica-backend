import { randomUUID } from "node:crypto";
import { pool } from "../../database/postgres";
import {
  CreateWasteInput,
  UpdateWasteInput,
  WasteRecord,
  WasteSummary,
} from "./waste.schema";

interface WasteRow {
  id: string;
  record_date: string;
  weight_kg: string;
  description: string | null;
  sold: boolean;
  sale_amount: string | null;
  sold_at: string | null;
  buyer: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function rowToWaste(row: WasteRow): WasteRecord {
  return {
    id: row.id,
    recordDate: new Date(row.record_date).toISOString().split("T")[0],
    weightKg: Number(row.weight_kg),
    description: row.description,
    sold: row.sold,
    saleAmount: row.sale_amount != null ? Number(row.sale_amount) : null,
    soldAt: row.sold_at ? new Date(row.sold_at).toISOString() : null,
    buyer: row.buyer,
    notes: row.notes,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

async function findAll(): Promise<WasteRecord[]> {
  const result = await pool.query<WasteRow>(
    `SELECT * FROM waste_records ORDER BY record_date DESC`,
  );
  return result.rows.map(rowToWaste);
}

async function findById(id: string): Promise<WasteRecord | null> {
  const result = await pool.query<WasteRow>(
    `SELECT * FROM waste_records WHERE id = $1`,
    [id],
  );
  return result.rows[0] ? rowToWaste(result.rows[0]) : null;
}

async function create(input: CreateWasteInput): Promise<WasteRecord> {
  const id = randomUUID();
  const soldAt =
    input.sold && input.saleAmount ? new Date().toISOString() : null;
  const result = await pool.query<WasteRow>(
    `INSERT INTO waste_records (id, record_date, weight_kg, description, sold, sale_amount, sold_at, buyer, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [
      id,
      input.recordDate ?? new Date().toISOString().split("T")[0],
      input.weightKg,
      input.description ?? null,
      input.sold,
      input.saleAmount ?? null,
      soldAt,
      input.buyer ?? null,
      input.notes ?? null,
    ],
  );
  return rowToWaste(result.rows[0]);
}

async function update(
  id: string,
  input: UpdateWasteInput,
): Promise<WasteRecord | null> {
  const fields: string[] = [];
  const params: unknown[] = [];

  if (input.recordDate !== undefined) {
    params.push(input.recordDate);
    fields.push(`record_date = $${params.length}`);
  }
  if (input.weightKg !== undefined) {
    params.push(input.weightKg);
    fields.push(`weight_kg = $${params.length}`);
  }
  if (input.description !== undefined) {
    params.push(input.description);
    fields.push(`description = $${params.length}`);
  }
  if (input.sold !== undefined) {
    params.push(input.sold);
    fields.push(`sold = $${params.length}`);
  }
  if (input.saleAmount !== undefined) {
    params.push(input.saleAmount);
    fields.push(`sale_amount = $${params.length}`);
  }
  if (input.soldAt !== undefined) {
    params.push(input.soldAt);
    fields.push(`sold_at = $${params.length}`);
  }
  if (input.buyer !== undefined) {
    params.push(input.buyer);
    fields.push(`buyer = $${params.length}`);
  }
  if (input.notes !== undefined) {
    params.push(input.notes);
    fields.push(`notes = $${params.length}`);
  }

  if (fields.length === 0) return findById(id);

  params.push(id);
  const result = await pool.query<WasteRow>(
    `UPDATE waste_records SET ${fields.join(", ")}, updated_at = NOW() WHERE id = $${params.length} RETURNING *`,
    params,
  );
  return result.rows[0] ? rowToWaste(result.rows[0]) : null;
}

async function remove(id: string): Promise<boolean> {
  const result = await pool.query(`DELETE FROM waste_records WHERE id = $1`, [
    id,
  ]);
  return (result.rowCount ?? 0) > 0;
}

async function getSummary(): Promise<WasteSummary> {
  const result = await pool.query<{
    total_weight: string;
    sold_weight: string;
    revenue: string;
    pending_weight: string;
  }>(
    `SELECT
       SUM(weight_kg) AS total_weight,
       SUM(CASE WHEN sold THEN weight_kg ELSE 0 END) AS sold_weight,
       COALESCE(SUM(CASE WHEN sold THEN sale_amount ELSE 0 END), 0) AS revenue,
       SUM(CASE WHEN NOT sold THEN weight_kg ELSE 0 END) AS pending_weight
     FROM waste_records`,
  );
  const row = result.rows[0];
  return {
    totalWeightKg: Number(row.total_weight ?? 0),
    totalSold: Number(row.sold_weight ?? 0),
    totalRevenue: Number(row.revenue ?? 0),
    pendingSaleWeightKg: Number(row.pending_weight ?? 0),
  };
}

export const wasteRepository = {
  findAll,
  findById,
  create,
  update,
  remove,
  getSummary,
};
