import {
  mkdirSync,
  openSync,
  closeSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { Pool, neon, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;
// Vite may evaluate this module again during HMR. Reuse the same connection.
const databases = (globalThis[Symbol.for("sabrina.databases")] ??= new Map());
export const isLocalDatabase = () => process.env.DATABASE_DRIVER === "local";
export const databaseConfigured = () =>
  isLocalDatabase() || Boolean(process.env.DATABASE_URL?.trim());

function localLock(path) {
  const lock = `${path}.lock`;
  mkdirSync(dirname(path), { recursive: true });
  try {
    const pid = Number(readFileSync(lock, "utf8"));
    try {
      process.kill(pid, 0);
    } catch (error) {
      if (error.code === "ESRCH") unlinkSync(lock);
      else throw error;
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  let fd;
  try {
    fd = openSync(lock, "wx", 0o600);
  } catch (error) {
    if (error.code === "EEXIST")
      throw new Error(
        "O banco local está em uso. Pare o servidor antes de executar setup:local, doctor ou db:migrate.",
      );
    throw error;
  }
  writeFileSync(fd, String(process.pid));
  closeSync(fd);
  const release = () => {
    try {
      unlinkSync(lock);
    } catch {}
  };
  process.once("exit", release);
  return () => {
    process.off("exit", release);
    release();
  };
}

async function connection() {
  if (!databaseConfigured())
    throw new Error(
      "DATABASE_URL ausente. Configure o Neon ou execute npm run setup:local.",
    );
  const local = isLocalDatabase();
  const key = local
    ? `local:${resolve(process.env.DATABASE_LOCAL_PATH || ".data/local")}`
    : process.env.DATABASE_URL;
  if (!databases.has(key)) {
    const pending = (async () => {
      if (!local) {
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          connectionTimeoutMillis: 10000,
        });
        return { pool, http: neon(process.env.DATABASE_URL) };
      }
      const hostname = new URL(process.env.AUTH_URL || "http://localhost:4000")
        .hostname;
      if (!["localhost", "127.0.0.1", "[::1]"].includes(hostname))
        throw new Error(
          "O banco de testes local exige AUTH_URL em localhost. Use Neon na hospedagem.",
        );
      const release = localLock(key.slice(6));
      try {
        const [{ PGlite }, { btree_gist }] = await Promise.all([
          import("@electric-sql/pglite"),
          import("@electric-sql/pglite/contrib/btree_gist"),
        ]);
        const db = new PGlite(key.slice(6), {
          extensions: { btree_gist },
          parsers: { 1082: (value) => value },
        });
        await db.waitReady;
        return { db, release };
      } catch (error) {
        release();
        throw error;
      }
    })();
    databases.set(key, pending);
    pending.catch(() => databases.delete(key));
  }
  return databases.get(key);
}

export async function queryDatabase(text, values = []) {
  const { db, pool } = await connection();
  return db ? db.query(text, values) : pool.query(text, values);
}

export async function databaseTransaction(callback) {
  const { db, pool } = await connection();
  if (db) return db.transaction(callback);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback({
      query: client.query.bind(client),
      exec: (text) => client.query(text),
    });
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Preserve Neon's lazy query + transaction contract used by the route handlers.
export function sql(strings, ...values) {
  const text =
    typeof strings === "string"
      ? strings
      : strings.reduce(
          (query, part, i) => query + (i ? `$${i}` : "") + part,
          "",
        );
  const params = typeof strings === "string" ? values[0] || [] : values;
  return {
    text,
    params,
    then(resolve, reject) {
      return connection()
        .then(({ db, http }) =>
          db
            ? db.query(text, params).then((result) => result.rows)
            : http(text, params),
        )
        .then(resolve, reject);
    },
  };
}
sql.transaction = async (queries) => {
  const { db, http } = await connection();
  if (!db)
    return http.transaction(
      queries.map(({ text, params }) => http(text, params)),
    );
  return db.transaction(async (tx) => {
    const results = [];
    for (const { text, params } of queries)
      results.push((await tx.query(text, params)).rows);
    return results;
  });
};

export async function closeDatabase() {
  for (const pending of databases.values()) {
    const { db, pool, release } = await pending;
    try {
      if (db) await db.close();
      else await pool.end();
    } finally {
      release?.();
    }
  }
  databases.clear();
}
