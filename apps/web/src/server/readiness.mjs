import { parseHttpOrigin } from "./origin.mjs";
import {
  databaseConfigured,
  isLocalDatabase,
  queryDatabase,
} from "./database.mjs";

export async function readiness() {
  const issues = [];
  const local = isLocalDatabase();
  if (!databaseConfigured())
    issues.push(
      "Banco não configurado. Preencha DATABASE_URL ou execute npm run setup:local.",
    );
  if (!process.env.AUTH_SECRET?.trim())
    issues.push(
      "AUTH_SECRET não configurado. Gere um segredo no .env ou execute npm run setup:local.",
    );
  if (!process.env.AUTH_URL?.trim())
    issues.push(
      "AUTH_URL não configurado. Use http://localhost:4000 localmente e a origem HTTPS na hospedagem.",
    );
  else if (!parseHttpOrigin(process.env.AUTH_URL))
    issues.push(
      "AUTH_URL inválido. Use um endereço completo, como http://localhost:4000 ou https://seu-dominio.com.",
    );
  let services = 0;
  if (databaseConfigured()) {
    try {
      const { rows: versions } = await queryDatabase(
        "SELECT name FROM salon_migrations",
      );
      if (
        [
          "001_schema.sql",
          "002_booking_integrity.sql",
          "003_link_existing_clients.sql",
          "004_products.sql",
          "005_catalog_photos.sql",
          "006_stock_alerts.sql",
          "007_request_limits.sql",
        ].some((name) => !versions.some((row) => row.name === name))
      )
        issues.push("Há migrações pendentes. Execute npm run db:migrate.");
      const { rows } = await queryDatabase(
        "SELECT count(*) AS count FROM services WHERE active = true",
      );
      services = Number(rows[0].count);
      const allowed = (
        process.env.ADMIN_EMAILS ||
        "jean.dev.com@gmail.com,estimesabrina15@gmail.com"
      )
        .split(",")
        .map((value) => value.trim().toLowerCase());
      const { rows: users } = await queryDatabase(
        "SELECT count(*) AS count FROM auth_users u JOIN auth_accounts a ON a.\"userId\" = u.id WHERE lower(u.email) = ANY($1::text[]) AND a.provider = 'credentials' AND a.password IS NOT NULL",
        [allowed],
      );
      if (!Number(users[0].count))
        issues.push(
          "Nenhuma conta de equipe autorizada foi criada. Execute npm run admin:create.",
        );
    } catch (error) {
      issues.push(
        error.code === "42P01" || error.code === "42703"
          ? "As tabelas do banco ainda não estão prontas. Execute npm run db:migrate."
          : "Não foi possível consultar o banco. Confira a conexão e pare o servidor local antes de executar doctor.",
      );
    }
  }
  return { ready: issues.length === 0, local, services, issues };
}
