import Credentials from "@auth/core/providers/credentials";
import { Auth } from "@auth/core";
import { allowedMutationOrigin, requestOrigin } from "../src/server/origin.mjs";
import { verify } from "argon2";
import { Hono } from "hono";
import { contextStorage } from "hono/context-storage";
import { bodyLimit } from "hono/body-limit";
import { secureHeaders } from "hono/secure-headers";
import { createHonoServer } from "react-router-hono-server/node";
import { isAuthAction } from "./is-auth-action";
import { API_BASENAME, api } from "./route-builder";
import { allowedAdmins } from "../src/app/api/utils/admin";
import {
  queryDatabase,
  databaseConfigured,
  isLocalDatabase,
} from "../src/server/database.mjs";

if (!process.env.AUTH_SECRET || !databaseConfigured())
  console.warn(
    "Sabrina Braids: configuração incompleta. Execute npm run doctor ou npm run setup:local em apps/web.",
  );
const app = new Hono();
app.use(contextStorage());
app.use("*", secureHeaders({ crossOriginEmbedderPolicy: false }));
app.use("/api/*", async (c, next) => {
  c.header("Cache-Control", "no-store");
  if (!["GET", "HEAD", "OPTIONS"].includes(c.req.method)) {
    try {
      if (
        !allowedMutationOrigin(
          c.req.url,
          c.req.header("origin"),
          c.req.header("sec-fetch-site"),
        )
      )
        return c.json({ error: "Origem não autorizada." }, 403);
    } catch (error) {
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Configuração do acesso inválida.",
        },
        503,
      );
    }
  }
  return next();
});
const limitBody = bodyLimit({
  maxSize: 4 * 1024 * 1024,
  onError: (c) =>
    c.json({ error: "Arquivo muito grande. Use imagens de até 2 MB." }, 413),
});
app.use("*", (c, next) => {
  const incoming = c.req.raw;
  if (incoming.body) {
    // The Node adapter exposes a lightweight Request. Normalize via URL + init
    // before bodyLimit clones streamed requests with the native constructor.
    const init = {
      method: incoming.method,
      headers: incoming.headers,
      body: incoming.body,
      signal: incoming.signal,
      duplex: "half",
    };
    c.req.raw = new Request(incoming.url, init);
  }
  return limitBody(c, next);
});
app.onError((error, c) => {
  console.error(error);
  return c.json({ error: "Não foi possível concluir a solicitação." }, 500);
});
app.get("/health", (c) => c.json({ status: "ok" }));
if (process.env.AUTH_SECRET) {
  app.use("/api/auth/*", async (c, next) => {
    if (!isAuthAction(c.req.path)) return next();
    let origin;
    try {
      origin = requestOrigin(c.req.url);
    } catch (error) {
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Configuração do acesso inválida.",
        },
        503,
      );
    }
    const url = new URL(c.req.url);
    const authRequest = new Request(`${origin}${url.pathname}${url.search}`, {
      method: c.req.method,
      headers: c.req.raw.headers,
      body: c.req.raw.body ? await c.req.blob() : undefined,
      signal: c.req.raw.signal,
    });
    return Auth(authRequest, {
      basePath: "/api/auth",
      // AUTH_URL is deliberately an origin; the auth routes have their own path.
      logger: {
        warn(code) {
          if (code !== "env-url-basepath-redundant")
            console.warn("[auth]", code);
        },
      },
      secret: process.env.AUTH_SECRET,
      trustHost: true,
      pages: {
        signIn: "/account/signin",
        signOut: "/account/logout",
        error: "/account/signin",
      },
      session: { strategy: "jwt" },
      useSecureCookies: origin.startsWith("https:"),
      callbacks: {
        session({ session, token }) {
          if (token.sub) session.user.id = token.sub;
          return session;
        },
      },
      providers: [
        Credentials({
          id: "credentials-signin",
          name: "E-mail e senha",
          credentials: {
            email: { type: "email" },
            password: { type: "password" },
          },
          async authorize(credentials) {
            if (
              typeof credentials.email !== "string" ||
              typeof credentials.password !== "string" ||
              credentials.password.length > 1024
            )
              return null;
            const email = credentials.email.trim().toLowerCase();
            if (!allowedAdmins().includes(email)) return null;
            const { rows } = await queryDatabase(
              'SELECT u.id, u.name, u.email, u.image, a.password FROM auth_users u JOIN auth_accounts a ON a."userId" = u.id WHERE lower(u.email) = $1 AND a.provider = $2',
              [email, "credentials"],
            );
            const user = rows[0];
            if (
              !user ||
              !user.password ||
              !(await verify(user.password, credentials.password))
            )
              return null;
            return {
              id: String(user.id),
              name: user.name,
              email: user.email,
              image: user.image,
            };
          },
        }),
      ],
    });
  });
} else {
  app.get("/api/auth/session", (c) => c.json(null));
  app.get("/api/auth/signin", (c) =>
    c.redirect("/account/signin?error=Configuration"),
  );
  app.get("/api/auth/error", (c) =>
    c.redirect("/account/signin?error=Configuration"),
  );
  app.all("/api/auth/*", (c) =>
    c.json({ error: "Autenticação indisponível." }, 503),
  );
}
app.route(API_BASENAME, api);
// Keep existing bookmarks working; these pages use the same APIs and database.
app.get("/gestao", (c) =>
  c.redirect(`/admin/gestao${new URL(c.req.url).search}`, 302),
);
app.get("/gestao/*", (c) =>
  c.redirect(`/admin${c.req.path}${new URL(c.req.url).search}`, 302),
);
export default await createHonoServer({
  app,
  defaultLogger: false,
  hostname: isLocalDatabase() ? "127.0.0.1" : undefined,
});
