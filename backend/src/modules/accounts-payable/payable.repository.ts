import { randomUUID } from "node:crypto";
import { pool } from "../../database/postgres";
import {
  AccountPayable,
  CreatePayableInput,
  UpdatePayableInput,
} from "./payable.schema";

interface PayableRow {
  id: string;
  description: string;
  category: string;
  amount: string;
  due_date: string;
  paid_at: string | null;
  status: string;
  supplier: string | null;
  notes: string | null;
  recurrent: boolean;
  created_at: string;
  updated_at: string;
}

function rowToPayable(row: PayableRow): AccountPayable {
  return {
    id: row.id,
    description: row.description,
    category: row.category as AccountPayable["category"],
    amount: Number(row.amount),
    dueDate: new Date(row.due_date).toISOString().split("T")[0],
    paidAt: row.paid_at ? new Date(row.paid_at).toISOString() : null,
    status: row.status as AccountPayable["status"],
    supplier: row.supplier,
    notes: row.notes,
    recurrent: row.recurrent,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

async function findAll(status?: string): Promise<AccountPayable[]> {
  const query = status
    ? `SELECT * FROM accounts_payable WHERE status = $1 ORDER BY due_date ASC`
    : `SELECT * FROM accounts_payable ORDER BY due_date ASC`;
  const params = status ? [status] : [];
  const result = await pool.query<PayableRow>(query, params);
  return result.rows.map(rowToPayable);
}

async function findById(id: string): Promise<AccountPayable | null> {
  const result = await pool.query<PayableRow>(
    `SELECT * FROM accounts_payable WHERE id = $1`,
    [id],
  );
  return result.rows[0] ? rowToPayable(result.rows[0]) : null;
}

async function create(input: CreatePayableInput): Promise<AccountPayable> {
  const id = randomUUID();
  const result = await pool.query<PayableRow>(
    `INSERT INTO accounts_payable (id, description, category, amount, due_date, supplier, notes, recurrent)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [
      id,
      input.description,
      input.category,
      input.amount,
      input.dueDate,
      input.supplier ?? null,
      input.notes ?? null,
      input.recurrent,
    ],
  );
  return rowToPayable(result.rows[0]);
}

async function update(
  id: string,
  input: UpdatePayableInput,
): Promise<AccountPayable | null> {
  const fields: string[] = [];
  const params: unknown[] = [];

  if (input.description !== undefined) {
    params.push(input.description);
    fields.push(`description = $${params.length}`);
  }
  if (input.category !== undefined) {
    params.push(input.category);
    fields.push(`category = $${params.length}`);
  }
  if (input.amount !== undefined) {
    params.push(input.amount);
    fields.push(`amount = $${params.length}`);
  }
  if (input.dueDate !== undefined) {
    params.push(input.dueDate);
    fields.push(`due_date = $${params.length}`);
  }
  if (input.supplier !== undefined) {
    params.push(input.supplier);
    fields.push(`supplier = $${params.length}`);
  }
  if (input.notes !== undefined) {
    params.push(input.notes);
    fields.push(`notes = $${params.length}`);
  }
  if (input.recurrent !== undefined) {
    params.push(input.recurrent);
    fields.push(`recurrent = $${params.length}`);
  }
  if (input.status !== undefined) {
    params.push(input.status);
    fields.push(`status = $${params.length}`);
  }
  if (input.paidAt !== undefined) {
    params.push(input.paidAt);
    fields.push(`paid_at = $${params.length}`);
  }

  if (fields.length === 0) return findById(id);

  params.push(id);
  const result = await pool.query<PayableRow>(
    `UPDATE accounts_payable SET ${fields.join(", ")}, updated_at = NOW() WHERE id = $${params.length} RETURNING *`,
    params,
  );
  return result.rows[0] ? rowToPayable(result.rows[0]) : null;
}

async function remove(id: string): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM accounts_payable WHERE id = $1`,
    [id],
  );
  return (result.rowCount ?? 0) > 0;
}

async function getSummary(): Promise<{
  totalPending: number;
  totalPaid: number;
  totalOverdue: number;
  projectedProfitCoverage: number;
  projectedProfitBalance: number;
}> {
  const result = await pool.query<{ status: string; total: string }>(
    `SELECT status, SUM(amount) as total FROM accounts_payable GROUP BY status`,
  );
  const projectedResult = await pool.query<{ projected_profit: string }>(
    `SELECT COALESCE(SUM(profit_value), 0) AS projected_profit
     FROM budgets
     WHERE status IN ('pre_approved', 'approved')`,
  );

  let totalPending = 0,
    totalPaid = 0,
    totalOverdue = 0;
  for (const row of result.rows) {
    if (row.status === "pending") totalPending = Number(row.total);
    else if (row.status === "paid") totalPaid = Number(row.total);
    else if (row.status === "overdue") totalOverdue = Number(row.total);
  }

  const projectedProfit = Number(
    projectedResult.rows[0]?.projected_profit ?? 0,
  );
  const pendingAndOverdue = totalPending + totalOverdue;
  const projectedProfitBalance = projectedProfit - pendingAndOverdue;
  const projectedProfitCoverage =
    pendingAndOverdue > 0
      ? projectedProfit / pendingAndOverdue
      : projectedProfit > 0
        ? Infinity
        : 0;

  return {
    totalPending,
    totalPaid,
    totalOverdue,
    projectedProfitCoverage,
    projectedProfitBalance,
  };
}

async function purgePaidOlderThan(days: number): Promise<number> {
  const result = await pool.query(
    `DELETE FROM accounts_payable
     WHERE status = 'paid'
       AND paid_at IS NOT NULL
       AND paid_at <= NOW() - ($1::text || ' days')::interval`,
    [Math.max(1, Math.trunc(days))],
  );

  return result.rowCount ?? 0;
}

export const payableRepository = {
  findAll,
  findById,
  create,
  update,
  remove,
  getSummary,
  purgePaidOlderThan,
};
