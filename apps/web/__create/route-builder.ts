import { Hono } from "hono";
import type { Handler } from "hono/types";

const API_BASENAME = "/api";
const api = new Hono();
type RouteModule = Record<
  string,
  (
    request: Request,
    context: { params: Record<string, string> },
  ) => Promise<Response>
>;
// Static discovery lets Vite bundle every API route into the production server.
const modules = import.meta.glob(
  ["../src/app/api/**/route.js", "!../src/app/api/__create/**"],
  { eager: true },
) as Record<string, RouteModule>;
for (const [file, handlers] of Object.entries(modules).sort(
  ([a], [b]) => Number(a.includes("[")) - Number(b.includes("[")),
)) {
  if (file.includes("/api/__create/")) continue;
  const path =
    "/" +
    file
      .replace("../src/app/api/", "")
      .replace(/\/route\.js$/, "")
      .split("/")
      .map((part) => part.replace(/^\[([^\]]+)\]$/, ":$1"))
      .join("/");
  for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE"]) {
    if (typeof handlers[method] !== "function") continue;
    const handler: Handler = (c) =>
      handlers[method](c.req.raw, { params: c.req.param() });
    api.on(method, path, handler);
  }
}
export { api, API_BASENAME };
