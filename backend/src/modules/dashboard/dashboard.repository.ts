import { pool } from "../../database/postgres";

export interface DashboardSummary {
  // Revenue
  revenueThisMonth: number;
  revenueLastMonth: number;

  // Orders
  openOrdersCount: number;
  ordersThisMonth: number;

  // Budgets funnel
  budgetsDraftCount: number;
  budgetsPendingCount: number;
  budgetsApprovedCount: number;
  budgetsThisMonth: number;

  // Receivables
  receivablePending: number;
  receivableOverdue: number;
  receivablePaid: number;

  // Payables
  payablePending: number;
  payableOverdue: number;

  // Cash flow projection
  projectedBalance: number;

  // Monthly revenue chart (last 6 months)
  revenueByMonth: Array<{ month: string; revenue: number; cost: number }>;

  // Alerts
  lowStockCount: number;
  unpaidClichesTotal: number;
}

async function getDashboardSummary(): Promise<DashboardSummary> {
  const [
    revenueResult,
    openOrdersResult,
    budgetCountsResult,
    receivablesResult,
    payablesResult,
    revenueByMonthResult,
    lowStockResult,
    unpaidClichesResult,
  ] = await Promise.all([
    // Revenue: this month vs last month (paid receivables)
    pool.query<{ this_month: string; last_month: string }>(`
      SELECT
        COALESCE(SUM(CASE WHEN DATE_TRUNC('month', paid_at) = DATE_TRUNC('month', NOW()) THEN amount ELSE 0 END), 0) AS this_month,
        COALESCE(SUM(CASE WHEN DATE_TRUNC('month', paid_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month') THEN amount ELSE 0 END), 0) AS last_month
      FROM accounts_receivable
      WHERE status = 'paid'
    `),

    // Open orders (not delivered/cancelled)
    pool.query<{ open_orders: string; orders_this_month: string }>(`
      SELECT
        COUNT(CASE WHEN status NOT IN ('delivered', 'cancelled') THEN 1 END) AS open_orders,
        COUNT(CASE WHEN DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW()) THEN 1 END) AS orders_this_month
      FROM orders
    `),

    // Budget funnel counts
    pool.query<{
      draft: string;
      pending: string;
      approved: string;
      this_month: string;
    }>(`
      SELECT
        COUNT(CASE WHEN status = 'draft' THEN 1 END) AS draft,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) AS approved,
        COUNT(CASE WHEN DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW()) THEN 1 END) AS this_month
      FROM budgets
    `),

    // Receivables summary
    pool.query<{ status: string; total: string }>(`
      SELECT status, COALESCE(SUM(amount), 0) AS total
      FROM accounts_receivable
      GROUP BY status
    `),

    // Payables summary
    pool.query<{ status: string; total: string }>(`
      SELECT status, COALESCE(SUM(amount), 0) AS total
      FROM accounts_payable
      GROUP BY status
    `),

    // Revenue by month (last 6 months) — paid receivables vs approved budget costs
    pool.query<{ month: string; revenue: string; cost: string }>(`
      SELECT
        TO_CHAR(month_series, 'YYYY-MM') AS month,
        COALESCE((
          SELECT SUM(ar.amount) FROM accounts_receivable ar
          WHERE DATE_TRUNC('month', ar.paid_at) = month_series AND ar.status = 'paid'
        ), 0) AS revenue,
        COALESCE((
          SELECT SUM(ap.amount) FROM accounts_payable ap
          WHERE DATE_TRUNC('month', COALESCE(ap.paid_at, ap.due_date)) = month_series
        ), 0) AS cost
      FROM generate_series(
        DATE_TRUNC('month', NOW() - INTERVAL '5 months'),
        DATE_TRUNC('month', NOW()),
        '1 month'::INTERVAL
      ) AS month_series
      ORDER BY month_series ASC
    `),

    // Low stock alerts
    pool
      .query<{ count: string }>(
        `
      SELECT COUNT(*) AS count FROM products
      WHERE low_stock_alert = true AND stock_quantity <= alert_threshold
    `,
      )
      .catch(() => ({ rows: [{ count: "0" }] })),

    // Unpaid clichês total
    pool
      .query<{ total: string }>(
        `
      SELECT COALESCE(SUM(cost), 0) AS total FROM cliches WHERE paid = false
    `,
      )
      .catch(() => ({ rows: [{ total: "0" }] })),
  ]);

  const receivableMap: Record<string, number> = {};
  for (const row of receivablesResult.rows) {
    receivableMap[row.status] = Number(row.total);
  }

  const payableMap: Record<string, number> = {};
  for (const row of payablesResult.rows) {
    payableMap[row.status] = Number(row.total);
  }

  const receivablePending = receivableMap["pending"] ?? 0;
  const receivableOverdue = receivableMap["overdue"] ?? 0;
  const receivablePaid = receivableMap["paid"] ?? 0;
  const payablePending = payableMap["pending"] ?? 0;
  const payableOverdue = payableMap["overdue"] ?? 0;

  return {
    revenueThisMonth: Number(revenueResult.rows[0]?.this_month ?? 0),
    revenueLastMonth: Number(revenueResult.rows[0]?.last_month ?? 0),
    openOrdersCount: Number(openOrdersResult.rows[0]?.open_orders ?? 0),
    ordersThisMonth: Number(openOrdersResult.rows[0]?.orders_this_month ?? 0),
    budgetsDraftCount: Number(budgetCountsResult.rows[0]?.draft ?? 0),
    budgetsPendingCount: Number(budgetCountsResult.rows[0]?.pending ?? 0),
    budgetsApprovedCount: Number(budgetCountsResult.rows[0]?.approved ?? 0),
    budgetsThisMonth: Number(budgetCountsResult.rows[0]?.this_month ?? 0),
    receivablePending,
    receivableOverdue,
    receivablePaid,
    payablePending,
    payableOverdue,
    projectedBalance: receivablePending - (payablePending + payableOverdue),
    revenueByMonth: revenueByMonthResult.rows.map((r) => ({
      month: r.month,
      revenue: Number(r.revenue),
      cost: Number(r.cost),
    })),
    lowStockCount: Number(lowStockResult.rows[0]?.count ?? 0),
    unpaidClichesTotal: Number(unpaidClichesResult.rows[0]?.total ?? 0),
  };
}

export const dashboardRepository = { getDashboardSummary };
