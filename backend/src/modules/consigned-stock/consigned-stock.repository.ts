import { randomUUID } from "node:crypto";
import { pool } from "../../database/postgres";
import {
  ConsignedMovement,
  ConsignedMovementInput,
  ConsignedStockItem,
  UpsertConsignedStockInput,
} from "./consigned-stock.schema";

interface StockRow {
  id: string;
  client_id: string;
  client_name?: string;
  order_id: string | null;
  product_id: string | null;
  product_name: string;
  quantity: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
interface MovRow {
  id: string;
  consigned_stock_id: string;
  movement_type: string;
  quantity: number;
  reference: string | null;
  notes: string | null;
  created_at: string;
}

function rowToStock(row: StockRow): ConsignedStockItem {
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: row.client_name,
    orderId: row.order_id,
    productId: row.product_id,
    productName: row.product_name,
    quantity: row.quantity,
    notes: row.notes,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}
function rowToMov(row: MovRow): ConsignedMovement {
  return {
    id: row.id,
    consignedStockId: row.consigned_stock_id,
    movementType: row.movement_type as ConsignedMovement["movementType"],
    quantity: row.quantity,
    reference: row.reference,
    notes: row.notes,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

async function findAll(clientId?: string): Promise<ConsignedStockItem[]> {
  const query = clientId
    ? `SELECT cs.*, c.name AS client_name FROM consigned_stock cs
       LEFT JOIN clients c ON c.id = cs.client_id
       WHERE cs.client_id = $1 ORDER BY cs.product_name ASC`
    : `SELECT cs.*, c.name AS client_name FROM consigned_stock cs
       LEFT JOIN clients c ON c.id = cs.client_id ORDER BY c.name ASC, cs.product_name ASC`;
  const params = clientId ? [clientId] : [];
  const result = await pool.query<StockRow>(query, params);
  return result.rows.map(rowToStock);
}

async function findById(id: string): Promise<ConsignedStockItem | null> {
  const result = await pool.query<StockRow>(
    `SELECT cs.*, c.name AS client_name FROM consigned_stock cs
     LEFT JOIN clients c ON c.id = cs.client_id WHERE cs.id = $1`,
    [id],
  );
  return result.rows[0] ? rowToStock(result.rows[0]) : null;
}

async function upsert(
  input: UpsertConsignedStockInput,
): Promise<ConsignedStockItem> {
  const existing = await pool.query<StockRow>(
    `SELECT *
     FROM consigned_stock
     WHERE client_id = $1
       AND product_id IS NOT DISTINCT FROM $2
       AND order_id IS NOT DISTINCT FROM $3`,
    [input.clientId, input.productId ?? null, input.orderId ?? null],
  );
  if (existing.rows[0]) return rowToStock(existing.rows[0]);

  const id = randomUUID();
  const result = await pool.query<StockRow>(
    `INSERT INTO consigned_stock (id, client_id, order_id, product_id, product_name, notes)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [
      id,
      input.clientId,
      input.orderId ?? null,
      input.productId ?? null,
      input.productName,
      input.notes ?? null,
    ],
  );
  return rowToStock(result.rows[0]);
}

async function addMovement(
  stockId: string,
  input: ConsignedMovementInput,
): Promise<ConsignedMovement> {
  const delta =
    input.movementType === "entrada" ? input.quantity : -input.quantity;

  await pool.query(
    `UPDATE consigned_stock SET quantity = quantity + $1, updated_at = NOW() WHERE id = $2`,
    [delta, stockId],
  );

  const id = randomUUID();
  const result = await pool.query<MovRow>(
    `INSERT INTO consigned_stock_movements (id, consigned_stock_id, movement_type, quantity, reference, notes)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [
      id,
      stockId,
      input.movementType,
      input.quantity,
      input.reference ?? null,
      input.notes ?? null,
    ],
  );
  return rowToMov(result.rows[0]);
}

async function findMovements(stockId: string): Promise<ConsignedMovement[]> {
  const result = await pool.query<MovRow>(
    `SELECT * FROM consigned_stock_movements WHERE consigned_stock_id = $1 ORDER BY created_at DESC`,
    [stockId],
  );
  return result.rows.map(rowToMov);
}

export const consignedStockRepository = {
  findAll,
  findById,
  upsert,
  addMovement,
  findMovements,
};
