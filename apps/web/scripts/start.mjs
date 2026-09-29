import { loadEnvironment } from "./load-env.mjs";
loadEnvironment("production");
await import("../build/server/index.js");
