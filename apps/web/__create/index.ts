import Credentials from "@auth/core/providers/credentials";
import { authHandler, initAuthConfig } from "@hono/auth-js";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { verify } from "argon2";
import { Hono } from "hono";
import { contextStorage } from "hono/context-storage";
import { bodyLimit } from "hono/body-limit";
import { secureHeaders } from "hono/secure-headers";
import { createHonoServer } from "react-router-hono-server/node";
import ws from "ws";
import NeonAdapter from "./adapter";
import { isAuthAction } from "./is-auth-action";
import { API_BASENAME, api } from "./route-builder";
import { allowedAdmins } from "../src/app/api/utils/admin";

neonConfig.webSocketConstructor = ws;
const adapter = NeonAdapter(
  new Pool({ connectionString: process.env.DATABASE_URL }),
);
const app = new Hono();
app.use(contextStorage());
app.use("*", secureHeaders({ crossOriginEmbedderPolicy: false }));
app.use("/api/*", async (c, next) => {
  c.header("Cache-Control", "no-store");
  // Cookie-authenticated mutations must come from the same site.
  const origin = c.req.header("origin");
  const expected = new URL(process.env.AUTH_URL || c.req.url).origin;
  if (
    !["GET", "HEAD", "OPTIONS"].includes(c.req.method) &&
    origin &&
    origin !== expected
  )
    return c.json({ error: "Origem não autorizada." }, 403);
  return next();
});
app.use(
  "*",
  bodyLimit({
    maxSize: 4 * 1024 * 1024,
    onError: (c) =>
      c.json({ error: "Arquivo muito grande. Use imagens de até 2 MB." }, 413),
  }),
);
app.onError((error, c) => {
  console.error(error);
  return c.json({ error: "Não foi possível concluir a solicitação." }, 500);
});
app.get("/health", (c) => c.json({ status: "ok" }));
if (process.env.AUTH_SECRET) {
  app.use(
    "*",
    initAuthConfig(() => ({
      secret: process.env.AUTH_SECRET,
      trustHost: true,
      pages: { signIn: "/account/signin", signOut: "/account/logout" },
      session: { strategy: "jwt" },
      useSecureCookies:
        process.env.AUTH_URL?.startsWith("https:") ??
        process.env.NODE_ENV === "production",
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
            const user = await adapter.getUserByEmail(email);
            const account = user?.accounts.find(
              (account) => account.provider === "credentials",
            );
            if (
              !user ||
              !account?.password ||
              !(await verify(account.password, credentials.password))
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
    })),
  );
  app.use("/api/auth/*", (c, next) =>
    isAuthAction(c.req.path) ? authHandler()(c, next) : next(),
  );
} else {
  app.get("/api/auth/session", (c) => c.json(null));
  app.all("/api/auth/*", (c) =>
    c.json({ error: "Autenticação indisponível." }, 503),
  );
}
app.route(API_BASENAME, api);
export default await createHonoServer({ app, defaultLogger: false });
