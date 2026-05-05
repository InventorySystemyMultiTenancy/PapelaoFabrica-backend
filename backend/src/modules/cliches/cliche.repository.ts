import { randomUUID } from "node:crypto";
import { pool } from "../../database/postgres";
import { Cliche, CreateClicheInput, UpdateClicheInput } from "./cliche.schema";

interface ClicheRow {
  id: string;
  client_id: string;
  client_name?: string;
  name: string;
  colors: number;
  width_cm: string | null;
  height_cm: string | null;
  cost: string;
  paid: boolean;
  paid_at: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

function rowToCliche(row: ClicheRow): Cliche {
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: row.client_name,
    name: row.name,
    colors: row.colors,
    widthCm: row.width_cm != null ? Number(row.width_cm) : null,
    heightCm: row.height_cm != null ? Number(row.height_cm) : null,
    cost: Number(row.cost),
    paid: row.paid,
    paidAt: row.paid_at ? new Date(row.paid_at).toISOString() : null,
    notes: row.notes,
    status: row.status as Cliche["status"],
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

async function findAll(clientId?: string): Promise<Cliche[]> {
  const query = clientId
    ? `SELECT ch.*, c.name AS client_name FROM cliches ch
       LEFT JOIN clients c ON c.id = ch.client_id
       WHERE ch.client_id = $1 ORDER BY ch.created_at DESC`
    : `SELECT ch.*, c.name AS client_name FROM cliches ch
       LEFT JOIN clients c ON c.id = ch.client_id
       ORDER BY ch.created_at DESC`;
  const params = clientId ? [clientId] : [];
  const result = await pool.query<ClicheRow>(query, params);
  return result.rows.map(rowToCliche);
}

async function findById(id: string): Promise<Cliche | null> {
  const result = await pool.query<ClicheRow>(
    `SELECT ch.*, c.name AS client_name FROM cliches ch
     LEFT JOIN clients c ON c.id = ch.client_id
     WHERE ch.id = $1`,
    [id],
  );
  return result.rows[0] ? rowToCliche(result.rows[0]) : null;
}

async function create(input: CreateClicheInput): Promise<Cliche> {
  const id = randomUUID();
  const result = await pool.query<ClicheRow>(
    `INSERT INTO cliches (id, client_id, name, colors, width_cm, height_cm, cost, paid, paid_at, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [
      id,
      input.clientId,
      input.name,
      input.colors,
      input.widthCm ?? null,
      input.heightCm ?? null,
      input.cost,
      input.paid,
      input.paidAt ?? null,
      input.notes ?? null,
    ],
  );
  return rowToCliche(result.rows[0]);
}

async function update(
  id: string,
  input: UpdateClicheInput,
): Promise<Cliche | null> {
  const fields: string[] = [];
  const params: unknown[] = [];

  if (input.name !== undefined) {
    params.push(input.name);
    fields.push(`name = $${params.length}`);
  }
  if (input.colors !== undefined) {
    params.push(input.colors);
    fields.push(`colors = $${params.length}`);
  }
  if (input.widthCm !== undefined) {
    params.push(input.widthCm);
    fields.push(`width_cm = $${params.length}`);
  }
  if (input.heightCm !== undefined) {
    params.push(input.heightCm);
    fields.push(`height_cm = $${params.length}`);
  }
  if (input.cost !== undefined) {
    params.push(input.cost);
    fields.push(`cost = $${params.length}`);
  }
  if (input.paid !== undefined) {
    params.push(input.paid);
    fields.push(`paid = $${params.length}`);
  }
  if (input.paidAt !== undefined) {
    params.push(input.paidAt);
    fields.push(`paid_at = $${params.length}`);
  }
  if (input.notes !== undefined) {
    params.push(input.notes);
    fields.push(`notes = $${params.length}`);
  }
  if (input.status !== undefined) {
    params.push(input.status);
    fields.push(`status = $${params.length}`);
  }

  if (fields.length === 0) return findById(id);

  params.push(id);
  const result = await pool.query<ClicheRow>(
    `UPDATE cliches SET ${fields.join(", ")}, updated_at = NOW() WHERE id = $${params.length} RETURNING *`,
    params,
  );
  return result.rows[0] ? rowToCliche(result.rows[0]) : null;
}

async function remove(id: string): Promise<boolean> {
  const result = await pool.query(`DELETE FROM cliches WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export const clicheRepository = { findAll, findById, create, update, remove };
