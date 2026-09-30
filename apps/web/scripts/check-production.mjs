import { loadEnvironment } from "./load-env.mjs";
import { productionIssues } from "../src/server/production-config.mjs";
loadEnvironment("production");
const issues = productionIssues();
if (!issues.length) {
  const { readiness } = await import("../src/server/readiness.mjs");
  const { closeDatabase } = await import("../src/server/database.mjs");
  try {
    issues.push(...(await readiness()).issues);
  } finally {
    await closeDatabase();
  }
}
if (issues.length) {
  console.error(
    "Configuração de produção pendente:\n" +
      issues.map((issue) => `- ${issue}`).join("\n"),
  );
  process.exitCode = 1;
} else
  console.log(
    "Produção: configuração, banco, migrações e acesso da equipe verificados.",
  );
