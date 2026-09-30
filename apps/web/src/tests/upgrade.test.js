// @vitest-environment node
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import { expect, it } from "vitest";
import { productionIssues } from "../server/production-config.mjs";

it("upgrades the previous schema preserving catalog photos and existing stock", async () => {
  const db = new PGlite({ extensions: { btree_gist } });
  const migrate = async (name) =>
    db.exec(
      await readFile(
        new URL(`../../migrations/${name}`, import.meta.url),
        "utf8",
      ),
    );
  try {
    for (const name of [
      "001_schema.sql",
      "002_booking_integrity.sql",
      "003_link_existing_clients.sql",
      "004_products.sql",
    ])
      await migrate(name);
    await db.exec(
      "INSERT INTO services (name,price,duration_minutes,image_url) VALUES ('Histórico',100,60,'https://example.test/old-service.jpg'); INSERT INTO products (name,image_url,active) VALUES ('Gel antigo','https://example.test/old-product.jpg',true); INSERT INTO stock_items (name,quantity,min_quantity) VALUES ('Gel',3,0)",
    );
    for (const name of [
      "005_catalog_photos.sql",
      "006_stock_alerts.sql",
      "007_request_limits.sql",
    ])
      await migrate(name);
    expect((await db.query("SELECT * FROM services")).rows[0]).toMatchObject({
      name: "Histórico",
      image_urls: ["https://example.test/old-service.jpg"],
    });
    expect((await db.query("SELECT * FROM products")).rows[0]).toMatchObject({
      name: "Gel antigo",
      image_urls: ["https://example.test/old-product.jpg"],
      active: true,
    });
    expect((await db.query("SELECT * FROM stock_items")).rows[0].quantity).toBe(
      3,
    );
    expect((await db.query("SELECT * FROM stock_alerts")).rows).toHaveLength(1);
  } finally {
    await db.close();
  }
}, 30000);

it("requires an explicit HTTPS production configuration and rejects local/testing secrets", () => {
  const valid = {
    DATABASE_DRIVER: "neon",
    DATABASE_URL: "postgresql://example.test/db",
    AUTH_URL: "https://salon.example",
    AUTH_SECRET: "a-secure-random-secret-at-least-32-characters",
    ADMIN_EMAILS: "team@example.test",
    TRUST_PROXY_HOPS: "1",
  };
  expect(productionIssues(valid)).toEqual([]);
  for (const overrides of [
    { DATABASE_DRIVER: "local" },
    { AUTH_URL: "http://salon.example" },
    { AUTH_URL: "https://salon.example/admin" },
    { AUTH_SECRET: "short" },
    { ADMIN_EMAILS: "" },
    { TRUST_PROXY_HOPS: "6" },
  ])
    expect(productionIssues({ ...valid, ...overrides }).length).toBeGreaterThan(
      0,
    );
});
