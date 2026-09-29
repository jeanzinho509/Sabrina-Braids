import { loadEnvironment } from "./load-env.mjs";
import { readiness } from "../src/server/readiness.mjs";
import { closeDatabase } from "../src/server/database.mjs";
loadEnvironment();
try {
  const status = await readiness();
  console.log(`Ambiente: ${status.local ? "banco local de testes" : "Neon"}`);
  for (const issue of status.issues) console.log(`PENDENTE: ${issue}`);
  if (status.ready)
    console.log("OK: banco, migrações e acesso administrativo configurados.");
  if (status.ready && !status.services)
    console.log(
      "Catálogo vazio: entre em /admin, adicione um serviço e marque-o como ativo.",
    );
  if (status.services) console.log(`Serviços ativos: ${status.services}`);
  process.exitCode = status.ready ? 0 : 1;
} finally {
  await closeDatabase();
}
