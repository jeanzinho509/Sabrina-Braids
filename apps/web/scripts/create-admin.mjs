import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { hash } from "argon2";
import ws from "ws";
if (!process.env.DATABASE_URL)
  throw new Error("Configure DATABASE_URL no .env.");
let muted = false;
const output = new Writable({
  write(chunk, encoding, done) {
    if (!muted) process.stdout.write(chunk);
    done();
  },
});
const input = createInterface({
  input: process.stdin,
  output,
  terminal: process.stdin.isTTY,
});
let email, password;
try {
  email = (await input.question("E-mail da conta: ")).trim().toLowerCase();
  const allowed = (
    process.env.ADMIN_EMAILS ||
    "jean.dev.com@gmail.com,estimesabrina15@gmail.com"
  )
    .split(",")
    .map((value) => value.trim().toLowerCase());
  if (!allowed.includes(email))
    throw new Error("Este e-mail não está em ADMIN_EMAILS.");
  process.stdout.write("Senha (mínimo de 12 caracteres; não será exibida): ");
  muted = true;
  password = await input.question("");
  muted = false;
  process.stdout.write("\n");
  if (password.length < 12) throw new Error("Use pelo menos 12 caracteres.");
} finally {
  muted = false;
  input.close();
}
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
try {
  await client.query("BEGIN");
  const existing = await client.query(
    "SELECT id FROM auth_users WHERE lower(email) = $1",
    [email],
  );
  if (existing.rows.length)
    throw new Error("A conta já existe. Nenhuma senha foi alterada.");
  const { rows } = await client.query(
    "INSERT INTO auth_users (name, email) VALUES ($1, $2) RETURNING id",
    ["Equipe Sabrina Braids", email],
  );
  await client.query(
    'INSERT INTO auth_accounts ("userId", type, provider, "providerAccountId", password) VALUES ($1, $2, $3, $4, $5)',
    [
      rows[0].id,
      "credentials",
      "credentials",
      String(rows[0].id),
      await hash(password),
    ],
  );
  await client.query("COMMIT");
  console.log("Conta criada. Acesse /account/signin.");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
