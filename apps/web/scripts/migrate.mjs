import { readdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
if (!process.env.DATABASE_URL)
  throw new Error("Configure DATABASE_URL no .env.");
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
try {
  await client.query("SELECT pg_advisory_lock(82491, 0)");
  await client.query(
    "CREATE TABLE IF NOT EXISTS salon_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())",
  );
  const folder = new URL("../migrations/", import.meta.url);
  for (const name of (await readdir(folder))
    .filter((name) => name.endsWith(".sql"))
    .sort()) {
    const sql = await readFile(new URL(name, folder), "utf8");
    const checksum = createHash("sha256").update(sql).digest("hex");
    const { rows } = await client.query(
      "SELECT checksum FROM salon_migrations WHERE name = $1",
      [name],
    );
    if (rows.length) {
      if (rows[0].checksum !== checksum)
        throw new Error(
          `A migração aplicada ${name} foi modificada. Crie uma nova migração.`,
        );
      console.log(`Já aplicada: ${name}`);
      continue;
    }
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query(
        "INSERT INTO salon_migrations (name, checksum) VALUES ($1, $2)",
        [name, checksum],
      );
      await client.query("COMMIT");
      console.log(`Aplicada: ${name}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
} finally {
  await client.query("SELECT pg_advisory_unlock(82491, 0)");
  client.release();
  await pool.end();
}
