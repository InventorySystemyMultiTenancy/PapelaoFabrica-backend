import { randomUUID } from "node:crypto";
import { pool } from "../../database/postgres";
import {
  AccountReceivable,
  CashflowSummary,
  GenerateInstallmentsInput,
  ReceivableStatus,
  UpdateReceivableInput,
} from "./financial.schema";

interface AccountReceivableRow {
  id: string;
  order_id: string;
  amount: string | number;
  due_date: string | Date;
  paid_at: string | Date | null;
  status: ReceivableStatus;
  installment: number;
  notes: string | null;
  created_at: string | Date;
  updated_at: string | Date;
}

function rowToReceivable(row: AccountReceivableRow): AccountReceivable {
  return {
    id: row.id,
    orderId: row.order_id,
    amount: Number(row.amount),
    dueDate: new Date(row.due_date).toISOString().split("T")[0],
    paidAt: row.paid_at ? new Date(row.paid_at).toISOString() : null,
    status: row.status,
    installment: row.installment,
    notes: row.notes,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

async function findByOrderId(orderId: string): Promise<AccountReceivable[]> {
  const result = await pool.query<AccountReceivableRow>(
    `SELECT * FROM accounts_receivable WHERE order_id = $1 ORDER BY installment ASC`,
    [orderId],
  );
  return result.rows.map(rowToReceivable);
}

async function findById(id: string): Promise<AccountReceivable | null> {
  const result = await pool.query<AccountReceivableRow>(
    `SELECT * FROM accounts_receivable WHERE id = $1`,
    [id],
  );
  return result.rows[0] ? rowToReceivable(result.rows[0]) : null;
}

async function createInstallments(
  input: GenerateInstallmentsInput,
  installments: Array<{ amount: number; dueDate: Date; installment: number }>,
): Promise<AccountReceivable[]> {
  // Remove existing installments for this order before recreating
  await pool.query(`DELETE FROM accounts_receivable WHERE order_id = $1`, [
    input.orderId,
  ]);

  const created: AccountReceivable[] = [];
  for (const inst of installments) {
    const id = randomUUID();
    const result = await pool.query<AccountReceivableRow>(
      `INSERT INTO accounts_receivable (id, order_id, amount, due_date, installment)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [
        id,
        input.orderId,
        inst.amount,
        inst.dueDate.toISOString().split("T")[0],
        inst.installment,
      ],
    );
    created.push(rowToReceivable(result.rows[0]));
  }
  return created;
}

async function updateReceivable(
  id: string,
  input: UpdateReceivableInput,
): Promise<AccountReceivable | null> {
  const fields: string[] = [];
  const params: unknown[] = [];

  if (input.status !== undefined) {
    params.push(input.status);
    fields.push(`status = $${params.length}`);
  }
  if (input.paidAt !== undefined) {
    params.push(input.paidAt);
    fields.push(`paid_at = $${params.length}`);
  }
  if (input.dueDate !== undefined) {
    params.push(input.dueDate);
    fields.push(`due_date = $${params.length}`);
  }
  if (input.notes !== undefined) {
    params.push(input.notes);
    fields.push(`notes = $${params.length}`);
  }

  if (fields.length === 0) return findById(id);

  fields.push(`updated_at = NOW()`);
  params.push(id);

  const result = await pool.query<AccountReceivableRow>(
    `UPDATE accounts_receivable SET ${fields.join(", ")} WHERE id = $${params.length} RETURNING *`,
    params,
  );
  return result.rows[0] ? rowToReceivable(result.rows[0]) : null;
}

interface CashflowRow {
  month: string;
  amount: string | number;
}

async function getCashflowSummary(): Promise<CashflowSummary> {
  // Expected income: pending receivables
  const incomeResult = await pool.query<{ total: string | number }>(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM accounts_receivable WHERE status = 'pending'`,
  );

  // Expected expenses: budgets with costs (approved, not yet paid)
  const expenseResult = await pool.query<{ total: string | number }>(
    `SELECT COALESCE(SUM(total_cost), 0) AS total FROM budgets WHERE status = 'approved'`,
  );

  const receivablesByMonthResult = await pool.query<CashflowRow>(
    `SELECT TO_CHAR(due_date, 'YYYY-MM') AS month, SUM(amount) AS amount
     FROM accounts_receivable
     WHERE status = 'pending'
     GROUP BY month
     ORDER BY month ASC`,
  );

  const projectedProfitResult = await pool.query<{ total: string | number }>(
    `SELECT COALESCE(SUM(profit_value), 0) AS total
     FROM budgets
     WHERE status IN ('pre_approved', 'approved')`,
  );

  const expectedIncome = Number(incomeResult.rows[0]?.total ?? 0);
  const expectedExpenses = Number(expenseResult.rows[0]?.total ?? 0);
  const projectedProfit = Number(projectedProfitResult.rows[0]?.total ?? 0);

  return {
    expectedIncome,
    expectedExpenses,
    cashflow: expectedIncome - expectedExpenses,
    projectedProfit,
    projectedProfitCashflow:
      expectedIncome + projectedProfit - expectedExpenses,
    receivablesByMonth: receivablesByMonthResult.rows.map((r) => ({
      month: r.month,
      amount: Number(r.amount),
    })),
  };
}

export const financialRepository = {
  findByOrderId,
  findById,
  createInstallments,
  updateReceivable,
  getCashflowSummary,
};
