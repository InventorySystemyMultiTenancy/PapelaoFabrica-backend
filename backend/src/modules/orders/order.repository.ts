import { randomUUID } from "node:crypto";
import { PoolClient } from "pg";
import { pool } from "../../database/postgres";
import { CreateOrderInput, ListOrdersQueryInput, Order, OrderItem, OrderStatus } from "./order.schema";

interface OrderRow {
  id: string;
  budget_id: string;
  status: OrderStatus;
  created_at: string | Date;
  updated_at: string | Date;
}

interface OrderItemRow {
  id: string;
  order_id: string;
  budget_item_id: string | null;
  description: string;
  quantity_total: string | number;
  quantity_produced: string | number;
  quantity_shipped: string | number;
  created_at: string | Date;
  updated_at: string | Date;
}

function rowToOrderItem(row: OrderItemRow): OrderItem {
  const produced = Number(row.quantity_produced);
  const shipped = Number(row.quantity_shipped);
  return {
    id: row.id,
    orderId: row.order_id,
    budgetItemId: row.budget_item_id,
    description: row.description,
    quantityTotal: Number(row.quantity_total),
    quantityProduced: produced,
    quantityShipped: shipped,
    remaining: produced - shipped,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function rowToOrder(row: OrderRow, items: OrderItem[]): Order {
  return {
    id: row.id,
    budgetId: row.budget_id,
    status: row.status,
    items,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

async function findAll(query: ListOrdersQueryInput): Promise<Order[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (query.status) {
    params.push(query.status);
    conditions.push(`o.status = $${params.length}`);
  }
  if (query.budgetId) {
    params.push(query.budgetId);
    conditions.push(`o.budget_id = $${params.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const orderRows = await pool.query<OrderRow>(
    `SELECT * FROM orders o ${where} ORDER BY o.created_at DESC`,
    params,
  );

  if (orderRows.rows.length === 0) return [];

  const orderIds = orderRows.rows.map((r) => r.id);
  const itemRows = await pool.query<OrderItemRow>(
    `SELECT * FROM order_items WHERE order_id = ANY($1::TEXT[]) ORDER BY created_at ASC`,
    [orderIds],
  );

  const itemsByOrderId = new Map<string, OrderItem[]>();
  for (const row of itemRows.rows) {
    const item = rowToOrderItem(row);
    const list = itemsByOrderId.get(row.order_id) ?? [];
    list.push(item);
    itemsByOrderId.set(row.order_id, list);
  }

  return orderRows.rows.map((row) => rowToOrder(row, itemsByOrderId.get(row.id) ?? []));
}

async function findById(id: string): Promise<Order | null> {
  const orderResult = await pool.query<OrderRow>(`SELECT * FROM orders WHERE id = $1`, [id]);
  if (!orderResult.rows[0]) return null;

  const itemResult = await pool.query<OrderItemRow>(
    `SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at ASC`,
    [id],
  );

  return rowToOrder(orderResult.rows[0], itemResult.rows.map(rowToOrderItem));
}

async function findItemById(itemId: string): Promise<OrderItem | null> {
  const result = await pool.query<OrderItemRow>(`SELECT * FROM order_items WHERE id = $1`, [itemId]);
  return result.rows[0] ? rowToOrderItem(result.rows[0]) : null;
}

async function create(input: CreateOrderInput): Promise<Order> {
  const client: PoolClient = await pool.connect();
  try {
    await client.query("BEGIN");

    const orderId = randomUUID();
    const orderResult = await client.query<OrderRow>(
      `INSERT INTO orders (id, budget_id, status) VALUES ($1,$2,'production') RETURNING *`,
      [orderId, input.budgetId],
    );

    const items: OrderItem[] = [];
    for (const item of input.items) {
      const itemId = randomUUID();
      const itemResult = await client.query<OrderItemRow>(
        `INSERT INTO order_items (id, order_id, budget_item_id, description, quantity_total)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [itemId, orderId, item.budgetItemId ?? null, item.description, item.quantityTotal],
      );
      items.push(rowToOrderItem(itemResult.rows[0]));
    }

    await client.query("COMMIT");
    return rowToOrder(orderResult.rows[0], items);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function updateItemProduced(itemId: string, quantityProduced: number): Promise<OrderItem | null> {
  const result = await pool.query<OrderItemRow>(
    `UPDATE order_items SET quantity_produced = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [quantityProduced, itemId],
  );
  return result.rows[0] ? rowToOrderItem(result.rows[0]) : null;
}

async function addToItemShipped(itemId: string, quantity: number): Promise<OrderItem | null> {
  const result = await pool.query<OrderItemRow>(
    `UPDATE order_items SET quantity_shipped = quantity_shipped + $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [quantity, itemId],
  );
  return result.rows[0] ? rowToOrderItem(result.rows[0]) : null;
}

async function recalcOrderStatus(orderId: string): Promise<void> {
  // partial: at least one shipped, completed: all shipped == total
  await pool.query(
    `UPDATE orders SET
       status = CASE
         WHEN (SELECT SUM(quantity_shipped) FROM order_items WHERE order_id = $1) = 0 THEN 'production'
         WHEN (SELECT COUNT(*) FROM order_items WHERE order_id = $1 AND quantity_shipped < quantity_total) = 0 THEN 'completed'
         ELSE 'partial'
       END,
       updated_at = NOW()
     WHERE id = $1`,
    [orderId],
  );
}

export const orderRepository = {
  findAll,
  findById,
  findItemById,
  create,
  updateItemProduced,
  addToItemShipped,
  recalcOrderStatus,
};
