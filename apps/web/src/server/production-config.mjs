import { parseHttpOrigin } from "./origin.mjs";

export function productionIssues(env = process.env) {
  const issues = [];
  if (env.DATABASE_DRIVER !== "neon")
    issues.push("Use DATABASE_DRIVER=neon na hospedagem.");
  if (!env.DATABASE_URL?.startsWith("postgres"))
    issues.push("Configure DATABASE_URL com a conexão do Neon.");
  const origin = parseHttpOrigin(env.AUTH_URL);
  if (
    !origin?.startsWith("https:") ||
    ["localhost", "127.0.0.1", "[::1]"].includes(
      origin ? new URL(origin).hostname : "",
    )
  )
    issues.push("AUTH_URL deve ser a origem HTTPS pública do site.");
  if (origin && env.AUTH_URL?.replace(/\/$/, "") !== origin)
    issues.push(
      "AUTH_URL deve conter somente a origem, sem caminho, consulta ou fragmento.",
    );
  if (!env.AUTH_SECRET || env.AUTH_SECRET.length < 32)
    issues.push("AUTH_SECRET precisa de pelo menos 32 caracteres aleatórios.");
  if (
    !env.ADMIN_EMAILS?.split(",").every((value) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
    )
  )
    issues.push(
      "Configure ADMIN_EMAILS explicitamente com os e-mails da equipe.",
    );
  const hops = Number(env.TRUST_PROXY_HOPS || 0);
  if (!Number.isInteger(hops) || hops < 0 || hops > 5)
    issues.push("TRUST_PROXY_HOPS deve ser um inteiro entre 0 e 5.");
  return issues;
}
