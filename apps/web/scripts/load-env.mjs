import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseEnv } from "node:util";

// Load server secrets before importing API/auth modules. Host variables win.
export function loadEnvironment(mode = process.env.NODE_ENV || "development") {
  const values = {};
  for (const name of [
    ".env",
    ".env.local",
    `.env.${mode}`,
    `.env.${mode}.local`,
  ]) {
    try {
      Object.assign(values, parseEnv(readFileSync(resolve(name), "utf8")));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  for (const [key, value] of Object.entries(values)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }
}
