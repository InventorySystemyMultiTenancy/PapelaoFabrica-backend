import { randomUUID } from "node:crypto";
import { pool } from "../database/postgres";
import { CreateProductInput, Product } from "../models/product.model";
import { AppError } from "../utils/app-error";

interface ProductRow {
  id: string;
  name: string | null;
  stock_quantity: string | number;
  low_stock_alert_quantity: string | number;
  is_paperboard_material: boolean | null;
  length: string | number | null;
  width: string | number | null;
  height: string | number | null;
  quality: string | null;
  gramatura: string | number | null;
  sheets_per_bundle: string | number | null;
  created_at: string | Date;
  updated_at: string | Date;
}

interface PaperboardProductColumns {
  isPaperboardMaterial: boolean;
  cla: boolean;
  sheetsPerBundle: boolean;
}

let paperboardProductColumnsExist: PaperboardProductColumns | null = null;

async function getPaperboardProductColumns(): Promise<PaperboardProductColumns> {
  if (paperboardProductColumnsExist !== null) {
    return paperboardProductColumnsExist;
  }
  const result = await pool.query<{ column_name: string }>(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'products'
        AND column_name IN (
          'is_paperboard_material',
          'length',
          'width',
          'height',
          'quality',
          'gramatura',
          'sheets_per_bundle'
        );
    `,
  );
  const columns = new Set(result.rows.map((row) => row.column_name));
  paperboardProductColumnsExist = {
    isPaperboardMaterial: columns.has("is_paperboard_material") && columns.has("gramatura"),
    cla:
      columns.has("length") &&
      columns.has("width") &&
      columns.has("height") &&
      columns.has("quality"),
    sheetsPerBundle: columns.has("sheets_per_bundle"),
  };
  return paperboardProductColumnsExist;
}

interface SaveProductInput {
  name: string;
  lowStockAlertQuantity: number;
  isPaperboardMaterial: boolean;
  length: number | null;
  width: number | null;
  height: number | null;
  quality: "CMCB" | "CMCBC" | null;
  gramatura: number | null;
}

function toNumber(value: string | number | null): number {
  if (value === null) {
    return 0;
  }

  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toDateString(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}

async function getPaperboardSelectSql(): Promise<string> {
  const columns = await getPaperboardProductColumns();
  const materialSelect = columns.isPaperboardMaterial
    ? "is_paperboard_material, gramatura"
    : "NULL::boolean AS is_paperboard_material, NULL::numeric AS gramatura";
  const claSelect = columns.cla
    ? "length, width, height, quality"
    : "NULL::numeric AS length, NULL::numeric AS width, NULL::numeric AS height, NULL::text AS quality";
  const sheetsSelect = columns.sheetsPerBundle
    ? "sheets_per_bundle"
    : "NULL::integer AS sheets_per_bundle";

  return `${materialSelect}, ${claSelect}, ${sheetsSelect}`;
}

function mapProductRow(row: ProductRow): Product {
  const stockQuantity = toNumber(row.stock_quantity);

  return {
    id: row.id,
    name: row.name && row.name.trim().length > 0 ? row.name : row.id,
    stockQuantity,
    lowStockAlertQuantity: toNumber(row.low_stock_alert_quantity),
    stockStatus: stockQuantity <= 0 ? "precisa_comprar" : "em_estoque",
    isPaperboardMaterial: row.is_paperboard_material ?? false,
    length: row.length !== null && row.length !== undefined ? toNumber(row.length) : null,
    width: row.width !== null && row.width !== undefined ? toNumber(row.width) : null,
    height: row.height !== null && row.height !== undefined ? toNumber(row.height) : null,
    quality: row.quality === "CMCB" || row.quality === "CMCBC" ? row.quality : null,
    gramatura: row.gramatura !== null && row.gramatura !== undefined ? toNumber(row.gramatura) : null,
    sheetsPerBundle: row.sheets_per_bundle !== null && row.sheets_per_bundle !== undefined ? Math.round(toNumber(row.sheets_per_bundle)) : null,
    createdAt: toDateString(row.created_at),
    updatedAt: toDateString(row.updated_at),
  };
}

function normalizeSchemaError(error: unknown): never {
  const code = (error as { code?: string }).code;

  if (code === "42P01" || code === "42703") {
    throw new AppError(
      "Products schema is not configured. Run sql/20260317_add_product_stock_movements.sql and sql/20260318_add_low_stock_alert_to_products.sql",
      500,
    );
  }

  throw error;
}

async function findAll(search?: string): Promise<Product[]> {
  try {
    const paperboardSelect = await getPaperboardSelectSql();
    const result = await pool.query<ProductRow>(
      `
        SELECT
          id::text AS id,
          name,
          stock_quantity,
          low_stock_alert_quantity,
          ${paperboardSelect},
          created_at,
          updated_at
        FROM public.products
        WHERE ($1::text IS NULL OR LOWER(COALESCE(name, '')) LIKE CONCAT('%', LOWER(BTRIM($1)), '%'))
        ORDER BY LOWER(COALESCE(name, id::text)) ASC, created_at DESC;
      `,
      [search ?? null],
    );

    return result.rows.map(mapProductRow);
  } catch (error) {
    normalizeSchemaError(error);
  }
}

async function findById(id: string): Promise<Product | undefined> {
  try {
    const paperboardSelect = await getPaperboardSelectSql();
    const result = await pool.query<ProductRow>(
      `
        SELECT
          id::text AS id,
          name,
          stock_quantity,
          low_stock_alert_quantity,
          ${paperboardSelect},
          created_at,
          updated_at
        FROM public.products
        WHERE id::text = $1;
      `,
      [id],
    );

    return result.rows[0] ? mapProductRow(result.rows[0]) : undefined;
  } catch (error) {
    normalizeSchemaError(error);
  }
}

async function findByName(name: string): Promise<Product | undefined> {
  try {
    const paperboardSelect = await getPaperboardSelectSql();
    const result = await pool.query<ProductRow>(
      `
        SELECT
          id::text AS id,
          name,
          stock_quantity,
          low_stock_alert_quantity,
          ${paperboardSelect},
          created_at,
          updated_at
        FROM public.products
        WHERE LOWER(BTRIM(COALESCE(name, ''))) = LOWER(BTRIM($1))
        LIMIT 1;
      `,
      [name],
    );

    return result.rows[0] ? mapProductRow(result.rows[0]) : undefined;
  } catch (error) {
    normalizeSchemaError(error);
  }
}

async function create(payload: CreateProductInput): Promise<Product> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const paperboardColumns = await getPaperboardProductColumns();
    const paperboardSelect = await getPaperboardSelectSql();
    const canWritePaperboard =
      paperboardColumns.isPaperboardMaterial && paperboardColumns.sheetsPerBundle;

    const result = canWritePaperboard && paperboardColumns.cla
      ? await client.query<ProductRow>(
          `
            INSERT INTO public.products (
              id, name, stock_quantity, low_stock_alert_quantity,
              is_paperboard_material, length, width, height, quality, gramatura, sheets_per_bundle
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING
              id::text AS id, name, stock_quantity, low_stock_alert_quantity,
              ${paperboardSelect}, created_at, updated_at;
          `,
          [
            randomUUID(), payload.name, payload.stockQuantity, payload.lowStockAlertQuantity,
            payload.isPaperboardMaterial ?? false,
            payload.length ?? null,
            payload.width ?? null,
            payload.height ?? null,
            payload.quality ?? null,
            payload.gramatura ?? null,
            payload.sheetsPerBundle ?? null,
          ],
        )
      : canWritePaperboard
        ? await client.query<ProductRow>(
            `
              INSERT INTO public.products (
                id, name, stock_quantity, low_stock_alert_quantity,
                is_paperboard_material, gramatura, sheets_per_bundle
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7)
              RETURNING
                id::text AS id, name, stock_quantity, low_stock_alert_quantity,
                ${paperboardSelect}, created_at, updated_at;
            `,
            [
              randomUUID(),
              payload.name,
              payload.stockQuantity,
              payload.lowStockAlertQuantity,
              payload.isPaperboardMaterial ?? false,
              payload.gramatura ?? null,
              payload.sheetsPerBundle ?? null,
            ],
          )
      : await client.query<ProductRow>(
          `
            INSERT INTO public.products (id, name, stock_quantity, low_stock_alert_quantity)
            VALUES ($1, $2, $3, $4)
            RETURNING
              id::text AS id, name, stock_quantity, low_stock_alert_quantity,
              ${paperboardSelect}, created_at, updated_at;
          `,
          [randomUUID(), payload.name, payload.stockQuantity, payload.lowStockAlertQuantity],
        );

    const product = mapProductRow(result.rows[0]);

    if (payload.stockQuantity > 0) {
      await client.query(
        `
          INSERT INTO public.product_stock_movements (
            product_id,
            movement_type,
            quantity,
            unit,
            reason,
            reference_type,
            reference_id
          )
          VALUES ($1, 'entrada', $2, NULL, $3, 'product', $4);
        `,
        [product.id, payload.stockQuantity, "Initial stock on product creation", product.id],
      );
    }

    await client.query("COMMIT");
    return product;
  } catch (error) {
    await client.query("ROLLBACK");
    normalizeSchemaError(error);
  } finally {
    client.release();
  }
}

async function update(
  id: string,
  payload: SaveProductInput & { sheetsPerBundle?: number | null },
): Promise<Product | undefined> {
  try {
    const paperboardColumns = await getPaperboardProductColumns();
    const paperboardSelect = await getPaperboardSelectSql();
    const canWritePaperboard =
      paperboardColumns.isPaperboardMaterial && paperboardColumns.sheetsPerBundle;

    const result = canWritePaperboard && paperboardColumns.cla
      ? await pool.query<ProductRow>(
          `
            UPDATE public.products
            SET name = $2, low_stock_alert_quantity = $3,
                is_paperboard_material = $4,
                length = $5,
                width = $6,
                height = $7,
                quality = $8,
                gramatura = $9,
                sheets_per_bundle = $10,
                updated_at = NOW()
            WHERE id::text = $1
            RETURNING id::text AS id, name, stock_quantity, low_stock_alert_quantity,
              ${paperboardSelect}, created_at, updated_at;
          `,
          [
            id,
            payload.name,
            payload.lowStockAlertQuantity,
            payload.isPaperboardMaterial,
            payload.length,
            payload.width,
            payload.height,
            payload.quality,
            payload.gramatura,
            payload.sheetsPerBundle ?? null,
          ],
        )
      : canWritePaperboard
        ? await pool.query<ProductRow>(
            `
              UPDATE public.products
              SET name = $2, low_stock_alert_quantity = $3,
                  is_paperboard_material = $4, gramatura = $5, sheets_per_bundle = $6,
                  updated_at = NOW()
              WHERE id::text = $1
              RETURNING id::text AS id, name, stock_quantity, low_stock_alert_quantity,
                ${paperboardSelect}, created_at, updated_at;
            `,
            [
              id,
              payload.name,
              payload.lowStockAlertQuantity,
              payload.isPaperboardMaterial,
              payload.gramatura,
              payload.sheetsPerBundle ?? null,
            ],
          )
      : await pool.query<ProductRow>(
          `
            UPDATE public.products
            SET name = $2, low_stock_alert_quantity = $3, updated_at = NOW()
            WHERE id::text = $1
            RETURNING id::text AS id, name, stock_quantity, low_stock_alert_quantity,
              ${paperboardSelect}, created_at, updated_at;
          `,
          [id, payload.name, payload.lowStockAlertQuantity],
        );

    return result.rows[0] ? mapProductRow(result.rows[0]) : undefined;
  } catch (error) {
    normalizeSchemaError(error);
  }
}

export const productRepository = {
  findAll,
  findById,
  findByName,
  create,
  update,
};
