import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { randomBytes } from "node:crypto";
import { prompt } from "./prompt.mjs";
import { migrate, createAdmin } from "../src/server/bootstrap.mjs";
import {
  queryDatabase,
  closeDatabase,
  databaseTransaction,
} from "../src/server/database.mjs";

// This command only opens the isolated local database, never DATABASE_URL.
console.log(
  "Configuração LOCAL de testes. Pare o servidor antes de continuar.\nSeu .env do Neon será preservado; exemplos não são dados reais do salão.",
);
const file = ".env.local";
const config = existsSync(file) ? parseEnv(readFileSync(file, "utf8")) : null;
if (config && config.DATABASE_DRIVER !== "local")
  throw new Error(
    "Já existe um .env.local com outra configuração. Nenhum arquivo foi alterado. Guarde-o com outro nome antes de executar setup:local.",
  );
if (config && !config.AUTH_SECRET)
  throw new Error(
    "O .env.local existente está incompleto: configure AUTH_SECRET antes de continuar.",
  );

const input = prompt();
try {
  const email =
    config?.ADMIN_EMAILS?.split(",")[0] ||
    (await input.ask("Seu e-mail para entrar na gestão: "))
      .trim()
      .toLowerCase();
  if (!/^[^\s@=]+@[^\s@=]+\.[^\s@=]+$/.test(email))
    throw new Error("Informe um e-mail válido.");
  const local = config || {
    DATABASE_DRIVER: "local",
    DATABASE_LOCAL_PATH: ".data/local",
    DATABASE_URL: "",
    AUTH_SECRET: randomBytes(32).toString("base64url"),
    AUTH_URL: "http://localhost:4000",
    ADMIN_EMAILS: email,
    PORT: "4000",
  };
  if (!config)
    writeFileSync(
      file,
      Object.entries(local)
        .map(([key, value]) => `${key}=${value}`)
        .join("\n") + "\n",
      { flag: "wx", mode: 0o600 },
    );
  Object.assign(process.env, local, { DATABASE_DRIVER: "local" });
  await migrate();
  const { rows: accounts } = await queryDatabase(
    "SELECT u.id FROM auth_users u JOIN auth_accounts a ON a.\"userId\" = u.id WHERE lower(u.email) = $1 AND a.provider = 'credentials' AND a.password IS NOT NULL",
    [email],
  );
  if (!accounts.length) {
    const password = await input.ask(
      "Crie uma senha (mínimo de 12 caracteres; não será exibida): ",
      true,
    );
    const confirmation = await input.ask("Confirme a senha: ", true);
    if (password !== confirmation)
      throw new Error("As senhas não conferem. Execute setup:local novamente.");
    await createAdmin(email, password);
    console.log("Conta local criada.");
  } else console.log("Conta local preservada. Use sua senha anterior.");

  await databaseTransaction(async (tx) => {
    const { rows } = await tx.query("SELECT count(*) AS count FROM services");
    if (Number(rows[0].count)) return;
    for (const [name, price, duration] of [
      ["Box Braids", 280, 240],
      ["Knotless Braids", 320, 300],
      ["Twists", 220, 180],
    ])
      await tx.query(
        "INSERT INTO services (name, description, price, duration_minutes) VALUES ($1,$2,$3,$4)",
        [
          `${name} · demonstração`,
          "Exemplo para testar o site. Preço e duração fictícios; cadastre os dados reais no admin antes de publicar.",
          price,
          duration,
        ],
      );
    console.log("Três serviços de demonstração cadastrados no banco local.");
  });
  console.log(
    `\nPronto. Execute npm run dev e abra ${process.env.AUTH_URL}.\nAdmin: ${process.env.AUTH_URL}/admin\nUse o e-mail informado e a senha que você criou. Os dados ficam em .data/local.\nEste ambiente é de testes; não atende clientes reais nem envia mensagens.`,
  );
} finally {
  input.close();
  await closeDatabase();
}
