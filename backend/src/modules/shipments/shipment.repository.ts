import { randomUUID } from "node:crypto";
import { PoolClient } from "pg";
import { pool } from "../../database/postgres";
import { CreateShipmentInput, Shipment, ShipmentItem } from "./shipment.schema";

interface ShipmentRow {
  id: string;
  order_id: string;
  notes: string | null;
  shipped_at: string | Date;
  created_at: string | Date;
}

interface ShipmentItemRow {
  id: string;
  shipment_id: string;
  order_item_id: string;
  quantity: string | number;
}

function rowToShipmentItem(row: ShipmentItemRow): ShipmentItem {
  return {
    id: row.id,
    shipmentId: row.shipment_id,
    orderItemId: row.order_item_id,
    quantity: Number(row.quantity),
  };
}

function rowToShipment(row: ShipmentRow, items: ShipmentItem[]): Shipment {
  return {
    id: row.id,
    orderId: row.order_id,
    notes: row.notes,
    shippedAt: new Date(row.shipped_at).toISOString(),
    items,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

async function findByOrderId(orderId: string): Promise<Shipment[]> {
  const shipmentResult = await pool.query<ShipmentRow>(
    `SELECT * FROM shipments WHERE order_id = $1 ORDER BY shipped_at ASC`,
    [orderId],
  );
  if (shipmentResult.rows.length === 0) return [];

  const shipmentIds = shipmentResult.rows.map((r) => r.id);
  const itemResult = await pool.query<ShipmentItemRow>(
    `SELECT * FROM shipment_items WHERE shipment_id = ANY($1::TEXT[])`,
    [shipmentIds],
  );

  const itemsByShipmentId = new Map<string, ShipmentItem[]>();
  for (const row of itemResult.rows) {
    const item = rowToShipmentItem(row);
    const list = itemsByShipmentId.get(row.shipment_id) ?? [];
    list.push(item);
    itemsByShipmentId.set(row.shipment_id, list);
  }

  return shipmentResult.rows.map((row) => rowToShipment(row, itemsByShipmentId.get(row.id) ?? []));
}

async function findById(id: string): Promise<Shipment | null> {
  const shipmentResult = await pool.query<ShipmentRow>(`SELECT * FROM shipments WHERE id = $1`, [id]);
  if (!shipmentResult.rows[0]) return null;

  const itemResult = await pool.query<ShipmentItemRow>(
    `SELECT * FROM shipment_items WHERE shipment_id = $1`,
    [id],
  );
  return rowToShipment(shipmentResult.rows[0], itemResult.rows.map(rowToShipmentItem));
}

async function create(input: CreateShipmentInput): Promise<Shipment> {
  const client: PoolClient = await pool.connect();
  try {
    await client.query("BEGIN");

    const shipmentId = randomUUID();
    const shipmentResult = await client.query<ShipmentRow>(
      `INSERT INTO shipments (id, order_id, notes, shipped_at)
       VALUES ($1,$2,$3,COALESCE($4::TIMESTAMPTZ, NOW())) RETURNING *`,
      [shipmentId, input.orderId, input.notes ?? null, input.shippedAt ?? null],
    );

    const items: ShipmentItem[] = [];
    for (const item of input.items) {
      const itemId = randomUUID();
      const itemResult = await client.query<ShipmentItemRow>(
        `INSERT INTO shipment_items (id, shipment_id, order_item_id, quantity)
         VALUES ($1,$2,$3,$4) RETURNING *`,
        [itemId, shipmentId, item.orderItemId, item.quantity],
      );
      items.push(rowToShipmentItem(itemResult.rows[0]));
    }

    await client.query("COMMIT");
    return rowToShipment(shipmentResult.rows[0], items);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export const shipmentRepository = { findByOrderId, findById, create };
