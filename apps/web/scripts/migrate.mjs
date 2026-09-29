import { loadEnvironment } from "./load-env.mjs";
import { migrate } from "../src/server/bootstrap.mjs";
import { closeDatabase } from "../src/server/database.mjs";
loadEnvironment();
try {
  await migrate();
} finally {
  await closeDatabase();
}
