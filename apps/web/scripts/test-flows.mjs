// Real HTTP/auth/SQL regression test against a disposable, persistent database.
// Run after npm run build. No Neon account or browser dependency is required.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, cp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { createServer } from "node:net";

const root = fileURLToPath(new URL("../", import.meta.url));
const fixture = await mkdtemp(join(tmpdir(), "sabrina-flows-"));
const env = { ...process.env, NODE_ENV: "production" };
for (const key of [
  "DATABASE_DRIVER",
  "DATABASE_URL",
  "DATABASE_LOCAL_PATH",
  "AUTH_SECRET",
  "AUTH_URL",
  "ADMIN_EMAILS",
  "PORT",
])
  delete env[key];
const email = "review@example.test";
const password = randomBytes(24).toString("base64url");
const socket = createServer();
socket.listen(0, "127.0.0.1");
await once(socket, "listening");
const port = socket.address().port;
await new Promise((resolve) => socket.close(resolve));
const base = `http://127.0.0.1:${port}`;
let server;
let serverLog = "";
const cookies = new Map();

async function command(script, input = "") {
  const child = spawn(process.execPath, [join(root, "scripts", script)], {
    cwd: fixture,
    env,
    stdio: ["pipe", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (chunk) => {
    output += chunk;
  });
  child.stderr.on("data", (chunk) => {
    output += chunk;
  });
  child.stdin.end(input);
  const [code] = await once(child, "exit");
  assert.equal(code, 0, output);
  return output;
}
async function start() {
  server = spawn(process.execPath, [join(root, "scripts/start.mjs")], {
    cwd: fixture,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.on("data", (chunk) => {
    serverLog += chunk;
  });
  server.stderr.on("data", (chunk) => {
    serverLog += chunk;
  });
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error(serverLog);
    try {
      if ((await fetch(`${base}/health`)).ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("O servidor não iniciou: " + serverLog);
}
async function stop() {
  if (server && server.exitCode === null) {
    const exited = once(server, "exit");
    server.kill();
    await exited;
  }
}
async function request(path, { authenticated = false, ...options } = {}) {
  const headers = new Headers(options.headers);
  if (authenticated)
    headers.set(
      "Cookie",
      [...cookies].map(([key, value]) => `${key}=${value}`).join("; "),
    );
  if (options.body && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  headers.set("Origin", base);
  const response = await fetch(base + path, {
    ...options,
    headers,
    redirect: "manual",
  });
  if (authenticated)
    for (const cookie of response.headers.getSetCookie()) {
      const pair = cookie.split(";")[0];
      const index = pair.indexOf("=");
      cookies.set(pair.slice(0, index), pair.slice(index + 1));
    }
  return response;
}
async function json(path, options) {
  const response = await request(path, options);
  const body = await response.json();
  assert.ok(response.ok, `${path}: ${response.status} ${JSON.stringify(body)}`);
  return body;
}

try {
  await command("setup-local.mjs", `${email}\n${password}\n${password}\n`);
  const configPath = join(fixture, ".env.local");
  const config = (await readFile(configPath, "utf8"))
    .replace("http://localhost:4000", base)
    .replace("PORT=4000", `PORT=${port}`);
  await writeFile(configPath, config);
  await command("setup-local.mjs"); // Must preserve account, secret and data.
  await command("doctor.mjs");
  await cp(join(root, "build/client"), join(fixture, "build/client"), {
    recursive: true,
  });
  await start();
  assert.equal((await json("/api/system/status")).ready, true);
  assert.equal((await json("/api/services")).services.length, 3);
  assert.equal((await request("/api/appointments")).status, 403);
  assert.equal((await request("/admin")).status, 200);
  assert.equal((await request("/not-a-page")).status, 404);

  const { csrfToken } = await json("/api/auth/csrf", { authenticated: true });
  const signIn = (secret) =>
    json("/api/auth/callback/credentials-signin", {
      authenticated: true,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Auth-Return-Redirect": "1",
      },
      body: new URLSearchParams({
        csrfToken,
        email,
        password: secret,
        callbackUrl: `${base}/admin`,
      }).toString(),
    });
  assert.match((await signIn("incorrect-password")).url, /CredentialsSignin/);
  assert.equal(
    (await request("/api/admin/check-access", { authenticated: true })).status,
    403,
  );
  assert.equal((await signIn(password)).url, `${base}/admin`);
  assert.equal(
    (await json("/api/auth/session", { authenticated: true })).user.email,
    email,
  );
  assert.equal(
    (await json("/api/admin/check-access", { authenticated: true })).authorized,
    true,
  );
  console.log(
    "OK: .env carregado, senha incorreta recusada, login e autorização reais.",
  );

  const saved = await json("/api/services", {
    authenticated: true,
    method: "POST",
    body: JSON.stringify({
      name: "Serviço cadastrado no teste",
      price: 150,
      duration_minutes: 60,
      active: true,
    }),
  });
  const hidden = await json("/api/services", {
    authenticated: true,
    method: "POST",
    body: JSON.stringify({
      name: "Rascunho",
      price: 100,
      duration_minutes: 60,
      active: false,
    }),
  });
  const catalog = (await json("/api/services")).services;
  assert.ok(catalog.some((item) => item.id === saved.service.id));
  assert.ok(!catalog.some((item) => item.id === hidden.service.id));
  const day = new Date();
  day.setUTCDate(day.getUTCDate() + 2);
  if (day.getUTCDay() === 6) day.setUTCDate(day.getUTCDate() + 1);
  const date = day.toISOString().slice(0, 10);
  const slots = await json(
    `/api/appointments/available-times?date=${date}&duration=60`,
  );
  assert.ok(slots.availableSlots.length > 0);
  const booking = {
    clientName: "Cliente de teste",
    clientPhone: "21987654321",
    serviceId: saved.service.id,
    appointmentDate: date,
    startTime: slots.availableSlots[0].start,
  };
  const created = await json("/api/appointments", {
    method: "POST",
    body: JSON.stringify(booking),
  });
  assert.equal(
    (
      await request("/api/appointments", {
        method: "POST",
        body: JSON.stringify(booking),
      })
    ).status,
    409,
  );
  const list = await json("/api/appointments", { authenticated: true });
  assert.ok(
    list.appointments.some((item) => item.id === created.appointment.id),
  );
  const finish = () =>
    json(`/api/appointments/${created.appointment.id}`, {
      authenticated: true,
      method: "PATCH",
      body: JSON.stringify({ status: "completed", amount: 150 }),
    });
  await finish();
  await finish();
  const finance = await json("/api/financial-transactions", {
    authenticated: true,
  });
  assert.equal(
    finance.transactions.filter(
      (item) => item.appointment_id === created.appointment.id,
    ).length,
    1,
  );
  console.log(
    "OK: catálogo, horários, agendamento, conflito e receita única com banco real.",
  );

  await stop();
  await start();
  assert.ok(
    (await json("/api/services")).services.some(
      (item) => item.id === saved.service.id,
    ),
  );
  assert.equal(
    (await json("/api/auth/session", { authenticated: true })).user.email,
    email,
  );
  assert.ok(
    !(
      await json(`/api/appointments/available-times?date=${date}&duration=60`)
    ).availableSlots.some((slot) => slot.start === booking.startTime),
  );
  console.log(
    "OK: dados, sessão e horários reservados persistem após reiniciar o servidor.",
  );

  await stop();
  await writeFile(
    configPath,
    config.replace(/^AUTH_SECRET=.*$/m, "AUTH_SECRET="),
  );
  await start();
  assert.equal((await json("/api/system/status")).ready, false);
  assert.equal((await request("/api/auth/providers")).status, 503);
  assert.equal(
    (await request("/api/auth/error")).headers.get("location"),
    "/account/signin?error=Configuration",
  );
  console.log(
    "OK: configuração incompleta identificada, sem redirecionar a equipe para JSON.",
  );
} catch (error) {
  console.error(serverLog.slice(-3000));
  throw error;
} finally {
  await stop();
  await rm(fixture, { recursive: true, force: true });
}
