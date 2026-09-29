import { loadEnvironment } from "./load-env.mjs";
import { prompt } from "./prompt.mjs";
import { createAdmin } from "../src/server/bootstrap.mjs";
import { closeDatabase } from "../src/server/database.mjs";
loadEnvironment();
const input = prompt();
try {
  const email = (await input.ask("E-mail da conta: ")).trim().toLowerCase();
  const password = await input.ask(
    "Senha (mínimo de 12 caracteres; não será exibida): ",
    true,
  );
  const confirmation = await input.ask("Confirme a senha: ", true);
  if (password !== confirmation) throw new Error("As senhas não conferem.");
  await createAdmin(email, password);
  console.log("Conta criada. Acesse /account/signin.");
} finally {
  input.close();
  await closeDatabase();
}
