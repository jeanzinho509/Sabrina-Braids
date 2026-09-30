import { loadEnvironment } from "./load-env.mjs";
loadEnvironment("production");
process.env.NODE_ENV = "production";
if (process.env.DATABASE_DRIVER !== "local") {
  const { productionIssues } = await import(
    "../src/server/production-config.mjs"
  );
  const issues = productionIssues();
  if (issues.length)
    throw new Error("Configuração de produção pendente:\n" + issues.join("\n"));
}
await import("../build/server/index.js");
