import fs from "node:fs";
import path from "node:path";
import { pool } from "./postgres";

const SQL_DIR = path.join(__dirname, "../../sql");

async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const result = await pool.query<{ filename: string }>(
    "SELECT filename FROM public.schema_migrations ORDER BY filename;",
  );
  return new Set(result.rows.map((r) => r.filename));
}

export async function runMigrations(): Promise<void> {
  console.log("[migrate] Starting database migrations...");

  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();

  const files = fs
    .readdirSync(SQL_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  let ran = 0;
  for (const file of files) {
    if (applied.has(file)) {
      continue;
    }

    const sql = fs.readFileSync(path.join(SQL_DIR, file), "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(
        "INSERT INTO public.schema_migrations (filename) VALUES ($1);",
        [file],
      );
      await client.query("COMMIT");
      console.log(`[migrate] ✓ ${file}`);
      ran++;
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`[migrate] ✗ ${file}:`, err);
      throw err;
    } finally {
      client.release();
    }
  }

  if (ran === 0) {
    console.log("[migrate] No new migrations to run.");
  } else {
    console.log(`[migrate] Done — ${ran} migration(s) applied.`);
  }
}
