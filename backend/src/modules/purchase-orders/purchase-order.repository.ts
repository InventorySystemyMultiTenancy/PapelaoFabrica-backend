import { randomUUID } from "node:crypto";
import { pool } from "../../database/postgres";
import {
  CreatePurchaseOrderInput,
  PurchaseOrder,
  PurchaseOrderItem,
  UpdatePurchaseOrderInput,
} from "./purchase-order.schema";

interface PORow {
  id: string;
  order_number: number;
  supplier: string;
  status: string;
  total_amount: string;
  notes: string | null;
  expected_delivery_date: string | null;
  sent_at: string | null;
  received_at: string | null;
  created_at: string;
  updated_at: string;
}
interface POItemRow {
  id: string;
  purchase_order_id: string;
  product_id: string | null;
  description: string;
  gramatura: string | null;
  sheet_width_cm: string | null;
  sheet_length_cm: string | null;
  quantity_kg: string;
  unit_price_per_kg: string | null;
  total_price: string | null;
  received_kg: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function rowToItem(row: POItemRow): PurchaseOrderItem {
  return {
    id: row.id,
    purchaseOrderId: row.purchase_order_id,
    productId: row.product_id,
    description: row.description,
    gramatura: row.gramatura != null ? Number(row.gramatura) : null,
    sheetWidthCm:
      row.sheet_width_cm != null ? Number(row.sheet_width_cm) : null,
    sheetLengthCm:
      row.sheet_length_cm != null ? Number(row.sheet_length_cm) : null,
    quantityKg: Number(row.quantity_kg),
    unitPricePerKg:
      row.unit_price_per_kg != null ? Number(row.unit_price_per_kg) : null,
    totalPrice: row.total_price != null ? Number(row.total_price) : null,
    receivedKg: Number(row.received_kg),
    notes: row.notes,
  };
}

function rowToPO(row: PORow, items: PurchaseOrderItem[]): PurchaseOrder {
  return {
    id: row.id,
    orderNumber: row.order_number,
    supplier: row.supplier,
    status: row.status as PurchaseOrder["status"],
    totalAmount: Number(row.total_amount),
    notes: row.notes,
    expectedDeliveryDate: row.expected_delivery_date
      ? new Date(row.expected_delivery_date).toISOString().split("T")[0]
      : null,
    sentAt: row.sent_at ? new Date(row.sent_at).toISOString() : null,
    receivedAt: row.received_at
      ? new Date(row.received_at).toISOString()
      : null,
    items,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

async function findAll(): Promise<PurchaseOrder[]> {
  const poResult = await pool.query<PORow>(
    `SELECT * FROM purchase_orders ORDER BY created_at DESC`,
  );
  if (poResult.rows.length === 0) return [];
  const ids = poResult.rows.map((r) => r.id);
  const itemsResult = await pool.query<POItemRow>(
    `SELECT * FROM purchase_order_items WHERE purchase_order_id = ANY($1)`,
    [ids],
  );
  return poResult.rows.map((po) => {
    const items = itemsResult.rows
      .filter((i) => i.purchase_order_id === po.id)
      .map(rowToItem);
    return rowToPO(po, items);
  });
}

async function findById(id: string): Promise<PurchaseOrder | null> {
  const poResult = await pool.query<PORow>(
    `SELECT * FROM purchase_orders WHERE id = $1`,
    [id],
  );
  if (!poResult.rows[0]) return null;
  const itemsResult = await pool.query<POItemRow>(
    `SELECT * FROM purchase_order_items WHERE purchase_order_id = $1`,
    [id],
  );
  return rowToPO(poResult.rows[0], itemsResult.rows.map(rowToItem));
}

async function create(input: CreatePurchaseOrderInput): Promise<PurchaseOrder> {
  const id = randomUUID();
  const totalAmount = input.items.reduce((sum, item) => {
    const total = item.quantityKg * (item.unitPricePerKg ?? 0);
    return sum + total;
  }, 0);

  await pool.query(
    `INSERT INTO purchase_orders (id, supplier, total_amount, expected_delivery_date, notes)
     VALUES ($1,$2,$3,$4,$5)`,
    [
      id,
      input.supplier,
      totalAmount,
      input.expectedDeliveryDate ?? null,
      input.notes ?? null,
    ],
  );

  for (const item of input.items) {
    const itemId = randomUUID();
    const totalPrice =
      item.unitPricePerKg != null
        ? item.quantityKg * item.unitPricePerKg
        : null;
    await pool.query(
      `INSERT INTO purchase_order_items
       (id, purchase_order_id, product_id, description, gramatura, sheet_width_cm, sheet_length_cm,
        quantity_kg, unit_price_per_kg, total_price, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        itemId,
        id,
        item.productId ?? null,
        item.description,
        item.gramatura ?? null,
        item.sheetWidthCm ?? null,
        item.sheetLengthCm ?? null,
        item.quantityKg,
        item.unitPricePerKg ?? null,
        totalPrice,
        item.notes ?? null,
      ],
    );
  }
  return (await findById(id))!;
}

async function update(
  id: string,
  input: UpdatePurchaseOrderInput,
): Promise<PurchaseOrder | null> {
  const fields: string[] = [];
  const params: unknown[] = [];
  if (input.supplier !== undefined) {
    params.push(input.supplier);
    fields.push(`supplier = $${params.length}`);
  }
  if (input.status !== undefined) {
    params.push(input.status);
    fields.push(`status = $${params.length}`);
  }
  if (input.expectedDeliveryDate !== undefined) {
    params.push(input.expectedDeliveryDate);
    fields.push(`expected_delivery_date = $${params.length}`);
  }
  if (input.notes !== undefined) {
    params.push(input.notes);
    fields.push(`notes = $${params.length}`);
  }
  if (input.sentAt !== undefined) {
    params.push(input.sentAt);
    fields.push(`sent_at = $${params.length}`);
  }
  if (input.receivedAt !== undefined) {
    params.push(input.receivedAt);
    fields.push(`received_at = $${params.length}`);
  }
  if (fields.length === 0) return findById(id);
  params.push(id);
  await pool.query(
    `UPDATE purchase_orders SET ${fields.join(", ")}, updated_at = NOW() WHERE id = $${params.length}`,
    params,
  );
  return findById(id);
}

async function remove(id: string): Promise<boolean> {
  const result = await pool.query(`DELETE FROM purchase_orders WHERE id = $1`, [
    id,
  ]);
  return (result.rowCount ?? 0) > 0;
}

export const purchaseOrderRepository = {
  findAll,
  findById,
  create,
  update,
  remove,
};
