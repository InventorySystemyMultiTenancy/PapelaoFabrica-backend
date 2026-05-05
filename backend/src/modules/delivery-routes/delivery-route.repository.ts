import { randomUUID } from "node:crypto";
import { pool } from "../../database/postgres";
import {
  ConfirmDeliveryItemInput,
  CreateDeliveryRouteInput,
  DeliveryRoute,
  DeliveryRouteItem,
  UpdateDeliveryRouteInput,
} from "./delivery-route.schema";

interface RouteRow {
  id: string;
  name: string;
  driver_name: string | null;
  vehicle: string | null;
  scheduled_date: string;
  departure_at: string | null;
  completed_at: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface RouteItemRow {
  id: string;
  route_id: string;
  shipment_id: string | null;
  client_id: string | null;
  client_name: string;
  address: string;
  quantity: number;
  delivered_at: string | null;
  received_by: string | null;
  delivery_notes: string | null;
  status: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

function rowToItem(row: RouteItemRow): DeliveryRouteItem {
  return {
    id: row.id,
    routeId: row.route_id,
    shipmentId: row.shipment_id,
    clientId: row.client_id,
    clientName: row.client_name,
    address: row.address,
    quantity: row.quantity,
    deliveredAt: row.delivered_at
      ? new Date(row.delivered_at).toISOString()
      : null,
    receivedBy: row.received_by,
    deliveryNotes: row.delivery_notes,
    status: row.status as DeliveryRouteItem["status"],
    sortOrder: row.sort_order,
  };
}

function rowToRoute(row: RouteRow, items: DeliveryRouteItem[]): DeliveryRoute {
  return {
    id: row.id,
    name: row.name,
    driverName: row.driver_name,
    vehicle: row.vehicle,
    scheduledDate: new Date(row.scheduled_date).toISOString().split("T")[0],
    departureAt: row.departure_at
      ? new Date(row.departure_at).toISOString()
      : null,
    completedAt: row.completed_at
      ? new Date(row.completed_at).toISOString()
      : null,
    status: row.status as DeliveryRoute["status"],
    notes: row.notes,
    items,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

async function findAll(): Promise<DeliveryRoute[]> {
  const routesResult = await pool.query<RouteRow>(
    `SELECT * FROM delivery_routes ORDER BY scheduled_date DESC`,
  );
  if (routesResult.rows.length === 0) return [];
  const ids = routesResult.rows.map((r) => r.id);
  const itemsResult = await pool.query<RouteItemRow>(
    `SELECT * FROM delivery_route_items WHERE route_id = ANY($1) ORDER BY sort_order ASC`,
    [ids],
  );
  return routesResult.rows.map((route) => {
    const items = itemsResult.rows
      .filter((i) => i.route_id === route.id)
      .map(rowToItem);
    return rowToRoute(route, items);
  });
}

async function findById(id: string): Promise<DeliveryRoute | null> {
  const routeResult = await pool.query<RouteRow>(
    `SELECT * FROM delivery_routes WHERE id = $1`,
    [id],
  );
  if (!routeResult.rows[0]) return null;
  const itemsResult = await pool.query<RouteItemRow>(
    `SELECT * FROM delivery_route_items WHERE route_id = $1 ORDER BY sort_order ASC`,
    [id],
  );
  return rowToRoute(routeResult.rows[0], itemsResult.rows.map(rowToItem));
}

async function create(input: CreateDeliveryRouteInput): Promise<DeliveryRoute> {
  const id = randomUUID();
  await pool.query(
    `INSERT INTO delivery_routes (id, name, driver_name, vehicle, scheduled_date, notes)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [
      id,
      input.name,
      input.driverName ?? null,
      input.vehicle ?? null,
      input.scheduledDate,
      input.notes ?? null,
    ],
  );
  for (const item of input.items) {
    const itemId = randomUUID();
    await pool.query(
      `INSERT INTO delivery_route_items (id, route_id, shipment_id, client_id, client_name, address, quantity, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        itemId,
        id,
        item.shipmentId ?? null,
        item.clientId ?? null,
        item.clientName,
        item.address,
        item.quantity,
        item.sortOrder,
      ],
    );
  }
  return (await findById(id))!;
}

async function update(
  id: string,
  input: UpdateDeliveryRouteInput,
): Promise<DeliveryRoute | null> {
  const fields: string[] = [];
  const params: unknown[] = [];

  if (input.name !== undefined) {
    params.push(input.name);
    fields.push(`name = $${params.length}`);
  }
  if (input.driverName !== undefined) {
    params.push(input.driverName);
    fields.push(`driver_name = $${params.length}`);
  }
  if (input.vehicle !== undefined) {
    params.push(input.vehicle);
    fields.push(`vehicle = $${params.length}`);
  }
  if (input.scheduledDate !== undefined) {
    params.push(input.scheduledDate);
    fields.push(`scheduled_date = $${params.length}`);
  }
  if (input.status !== undefined) {
    params.push(input.status);
    fields.push(`status = $${params.length}`);
  }
  if (input.departureAt !== undefined) {
    params.push(input.departureAt);
    fields.push(`departure_at = $${params.length}`);
  }
  if (input.completedAt !== undefined) {
    params.push(input.completedAt);
    fields.push(`completed_at = $${params.length}`);
  }
  if (input.notes !== undefined) {
    params.push(input.notes);
    fields.push(`notes = $${params.length}`);
  }

  if (fields.length > 0) {
    params.push(id);
    await pool.query(
      `UPDATE delivery_routes SET ${fields.join(", ")}, updated_at = NOW() WHERE id = $${params.length}`,
      params,
    );
  }
  return findById(id);
}

async function confirmItem(
  itemId: string,
  input: ConfirmDeliveryItemInput,
): Promise<DeliveryRouteItem | null> {
  const result = await pool.query<RouteItemRow>(
    `UPDATE delivery_route_items
     SET status = $1, received_by = $2, delivery_notes = $3, delivered_at = NOW(), updated_at = NOW()
     WHERE id = $4 RETURNING *`,
    [input.status, input.receivedBy, input.deliveryNotes ?? null, itemId],
  );
  return result.rows[0] ? rowToItem(result.rows[0]) : null;
}

async function remove(id: string): Promise<boolean> {
  const result = await pool.query(`DELETE FROM delivery_routes WHERE id = $1`, [
    id,
  ]);
  return (result.rowCount ?? 0) > 0;
}

export const deliveryRouteRepository = {
  findAll,
  findById,
  create,
  update,
  confirmItem,
  remove,
};
