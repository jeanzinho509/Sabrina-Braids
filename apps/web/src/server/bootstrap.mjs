import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { hash } from "argon2";
import { databaseTransaction } from "./database.mjs";

export async function migrate(log = console.log) {
  const folder = new URL("../../migrations/", import.meta.url);
  for (const name of (await readdir(folder))
    .filter((name) => name.endsWith(".sql"))
    .sort()) {
    const source = await readFile(new URL(name, folder), "utf8");
    const checksum = createHash("sha256").update(source).digest("hex");
    await databaseTransaction(async (tx) => {
      await tx.query("SELECT pg_advisory_xact_lock(82491, 0)");
      await tx.query(
        "CREATE TABLE IF NOT EXISTS salon_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())",
      );
      const { rows } = await tx.query(
        "SELECT checksum FROM salon_migrations WHERE name = $1",
        [name],
      );
      if (rows.length) {
        if (rows[0].checksum !== checksum)
          throw new Error(
            `A migração aplicada ${name} foi modificada. Crie uma nova migração.`,
          );
        log(`Já aplicada: ${name}`);
        return;
      }
      await tx.exec(source);
      await tx.query(
        "INSERT INTO salon_migrations (name, checksum) VALUES ($1, $2)",
        [name, checksum],
      );
      log(`Aplicada: ${name}`);
    });
  }
}

export async function createAdmin(email, password) {
  const allowed = (
    process.env.ADMIN_EMAILS ||
    "jean.dev.com@gmail.com,estimesabrina15@gmail.com"
  )
    .split(",")
    .map((value) => value.trim().toLowerCase());
  if (!allowed.includes(email))
    throw new Error("Este e-mail não está em ADMIN_EMAILS.");
  if (password.length < 12 || password.length > 1024)
    throw new Error("Use uma senha entre 12 e 1024 caracteres.");
  const passwordHash = await hash(password);
  return databaseTransaction(async (tx) => {
    const { rows: existing } = await tx.query(
      "SELECT id FROM auth_users WHERE lower(email) = $1",
      [email],
    );
    if (existing.length)
      throw new Error("A conta já existe. Nenhuma senha foi alterada.");
    const { rows } = await tx.query(
      "INSERT INTO auth_users (name, email) VALUES ($1, $2) RETURNING id",
      ["Equipe Sabrina Braids", email],
    );
    await tx.query(
      'INSERT INTO auth_accounts ("userId", type, provider, "providerAccountId", password) VALUES ($1, $2, $3, $4, $5)',
      [
        rows[0].id,
        "credentials",
        "credentials",
        String(rows[0].id),
        passwordHash,
      ],
    );
    return rows[0].id;
  });
}
