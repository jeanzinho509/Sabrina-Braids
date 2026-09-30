// @vitest-environment node
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import {
  beforeAll,
  afterAll,
  beforeEach,
  describe,
  it,
  expect,
  vi,
} from "vitest";

const state = vi.hoisted(() => ({ db: null, admin: true }));
vi.mock("@/app/api/utils/admin", () => ({
  requireAdmin: async () => state.admin,
}));
vi.mock("@/app/api/utils/sql", () => {
  function sql(strings, ...values) {
    const text =
      typeof strings === "string"
        ? strings
        : strings.reduce(
            (query, part, index) => query + (index ? `$${index}` : "") + part,
            "",
          );
    const params = typeof strings === "string" ? values[0] || [] : values;
    return {
      text,
      params,
      then(resolve, reject) {
        return state.db
          .query(text, params)
          .then((result) => result.rows)
          .then(resolve, reject);
      },
    };
  }
  sql.transaction = (queries) =>
    state.db.transaction(async (tx) => {
      const results = [];
      for (const query of queries)
        results.push((await tx.query(query.text, query.params)).rows);
      return results;
    });
  return { default: sql };
});
import * as services from "@/app/api/services/route";
import * as serviceItem from "@/app/api/services/[id]/route";
import * as stockAlerts from "@/app/api/stock-alerts/route";
import * as media from "@/app/api/media/route";
import * as mediaItem from "@/app/api/media/[id]/route";
import { consumeLimit, clientAddress } from "../server/rate-limit.mjs";
import * as products from "@/app/api/products/route";
import * as productItem from "@/app/api/products/[id]/route";
import * as appointments from "@/app/api/appointments/route";
import * as appointment from "@/app/api/appointments/[id]/route";
import * as timeBlocks from "@/app/api/time-blocks/route";
import * as clients from "@/app/api/clients/route";
import * as financial from "@/app/api/financial-transactions/route";
import * as transaction from "@/app/api/financial-transactions/[id]/route";
import * as stock from "@/app/api/stock-items/route";
import * as stockItem from "@/app/api/stock-items/[id]/route";
import * as tasks from "@/app/api/tasks/route";
import * as task from "@/app/api/tasks/[id]/route";
import * as goals from "@/app/api/monthly-goals/route";
import * as dashboard from "@/app/api/dashboard-summary/route";
import * as gallery from "@/app/api/gallery/route";
import * as galleryItem from "@/app/api/gallery/[id]/route";

const request = (path, method = "GET", body) =>
  new Request(`http://localhost/api/${path}`, {
    method,
    ...(body
      ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : {}),
  });
const context = (id) => ({ params: { id: String(id) } });
const booking = (overrides) => ({
  clientName: "Cliente de teste",
  clientPhone: "21987654321",
  serviceId: 1,
  appointmentDate: "2099-09-21",
  startTime: "09:30",
  ...overrides,
}); // Monday
beforeAll(async () => {
  state.db = new PGlite({ extensions: { btree_gist } });
  for (const name of [
    "001_schema.sql",
    "002_booking_integrity.sql",
    "003_link_existing_clients.sql",
    "004_products.sql",
    "005_catalog_photos.sql",
    "006_stock_alerts.sql",
    "007_request_limits.sql",
  ])
    await state.db.exec(
      await readFile(
        new URL(`../../migrations/${name}`, import.meta.url),
        "utf8",
      ),
    );
}, 30000);
afterAll(async () => state.db?.close());
beforeEach(async () => {
  state.admin = true;
  await state.db.exec(
    "TRUNCATE financial_transactions, appointments, clients, services, time_blocks, stock_items, tasks, monthly_goals, gallery, products, media_assets, request_limits RESTART IDENTITY CASCADE",
  );
  await state.db.query(
    "INSERT INTO services (name, price, duration_minutes) VALUES ('Box braids', 280, 180)",
  );
});

describe("operational API with a real Postgres engine", () => {
  it("denies anonymous operational reads and mutations", async () => {
    state.admin = false;
    const calls = [
      products.GET(request("products?active=false")),
      products.POST(request("products", "POST", {})),
      productItem.PATCH(request("products/1", "PATCH", {}), context(1)),
      productItem.DELETE(request("products/1", "DELETE"), context(1)),
      appointments.GET(request("appointments")),
      appointment.PATCH(
        request("appointments/1", "PATCH", { status: "completed" }),
        context(1),
      ),
      appointment.DELETE(request("appointments/1", "DELETE"), context(1)),
      timeBlocks.GET(request("time-blocks")),
      timeBlocks.POST(request("time-blocks", "POST", {})),
      clients.GET(request("clients")),
      financial.GET(request("financial-transactions")),
      stock.GET(),
      stockAlerts.GET(),
      stockAlerts.PATCH(request("stock-alerts", "PATCH", { alerts: [] })),
      media.POST(request("media", "POST", {})),
      services.POST(request("services", "POST", {})),
      serviceItem.PATCH(request("services/1", "PATCH", {}), context(1)),
      tasks.GET(request("tasks")),
      gallery.POST(request("gallery", "POST", {})),
      galleryItem.DELETE(request("gallery/1", "DELETE"), context(1)),
    ];
    expect(
      (await Promise.all(calls)).every((response) => response.status === 403),
    ).toBe(true);
  });
  it("books publicly, links the client and rejects duplicates and blocked hours", async () => {
    state.admin = false;
    const created = await appointments.POST(
      request("appointments", "POST", booking()),
    );
    expect(created.status).toBe(201);
    const duplicate = await appointments.POST(
      request("appointments", "POST", booking({ clientPhone: "21988888888" })),
    );
    expect(duplicate.status).toBe(409);
    expect((await state.db.query("SELECT * FROM clients")).rows).toHaveLength(
      1,
    );
    state.admin = true;
    const blocked = await timeBlocks.POST(
      request("time-blocks", "POST", {
        blockDate: "2099-09-21",
        startTime: "13:00",
        endTime: "16:00",
      }),
    );
    expect(blocked.status).toBe(201);
    expect(
      (
        await appointments.POST(
          request("appointments", "POST", booking({ startTime: "13:00" })),
        )
      ).status,
    ).toBe(409);
    expect(
      (
        await timeBlocks.POST(
          request("time-blocks", "POST", {
            blockDate: "2099-09-21",
            startTime: "10:00",
            endTime: "11:00",
          }),
        )
      ).status,
    ).toBe(409);
  });
  it("enforces overlap prevention in the database even if an API check is bypassed", async () => {
    await appointments.POST(request("appointments", "POST", booking()));
    await expect(
      state.db.query(
        "INSERT INTO appointments (client_name, client_phone, appointment_date, start_time, end_time) VALUES ('Other', '21900000000', '2099-09-21', '10:00', '11:00')",
      ),
    ).rejects.toMatchObject({ code: "23P01" });
  });
  it("completes atomically and books revenue exactly once", async () => {
    const created = await (
      await appointments.POST(request("appointments", "POST", booking()))
    ).json();
    const id = created.appointment.id;
    const finish = () =>
      appointment.PATCH(
        request(`appointments/${id}`, "PATCH", {
          status: "completed",
          amount: 250,
        }),
        context(id),
      );
    expect((await finish()).status).toBe(200);
    expect((await finish()).status).toBe(200);
    const entries = (
      await state.db.query("SELECT * FROM financial_transactions")
    ).rows;
    expect(entries).toHaveLength(1);
    expect(Number(entries[0].amount)).toBe(250);
    expect(
      (
        await appointment.DELETE(
          request(`appointments/${id}`, "DELETE"),
          context(id),
        )
      ).status,
    ).toBe(409);
    const summary = await (await dashboard.GET()).json();
    expect(summary.todayRevenue).toBe(250);
  });
  it("keeps completion and financial entry atomic when the insert fails", async () => {
    const created = await (
      await appointments.POST(request("appointments", "POST", booking()))
    ).json();
    const id = created.appointment.id;
    // An amount outside NUMERIC(12,2) must roll the status change back.
    const failed = await appointment.PATCH(
      request(`appointments/${id}`, "PATCH", {
        status: "completed",
        amount: 1e30,
      }),
      context(id),
    );
    expect(failed.status).toBe(500);
    expect(
      (
        await state.db.query("SELECT status FROM appointments WHERE id=$1", [
          id,
        ])
      ).rows[0].status,
    ).toBe("pending");
  });
  it("lists custom models and rejects malformed or closed-day bookings", async () => {
    const custom = booking({
      serviceId: null,
      custom_model_image: "https://example.com/braids.jpg",
      custom_model_description: "Modelo teste",
    });
    expect(
      (await appointments.POST(request("appointments", "POST", custom))).status,
    ).toBe(201);
    expect(
      (await (await appointments.GET(request("appointments"))).json())
        .appointments,
    ).toHaveLength(1);
    expect(
      (
        await appointments.POST(
          request(
            "appointments",
            "POST",
            booking({ appointmentDate: "2099-09-26" }),
          ),
        )
      ).status,
    ).toBe(409);
    expect(
      (
        await appointments.POST(
          request(
            "appointments",
            "POST",
            booking({ appointmentDate: "2099-02-30" }),
          ),
        )
      ).status,
    ).toBe(400);
  });
  it("links existing appointments without duplicating clients", async () => {
    await state.db.query(
      "INSERT INTO appointments (client_name, client_phone, appointment_date, start_time, end_time, status) VALUES ('Histórico', '(21) 98765-4321', '2020-01-01', '09:00', '12:00', 'completed')",
    );
    const migration = await readFile(
      new URL(
        "../../migrations/003_link_existing_clients.sql",
        import.meta.url,
      ),
      "utf8",
    );
    await state.db.exec(migration);
    await state.db.exec(migration);
    const data = await (await clients.GET(request("clients"))).json();
    expect(data.clients).toHaveLength(1);
    expect(Number(data.clients[0].history_count)).toBe(1);
  });
  it("persists stock, tasks, zero goals and paid-only financial totals", async () => {
    let response = await stock.POST(
      request("stock-items", "POST", {
        name: "Jumbo",
        quantity: 2,
        minQuantity: 0,
      }),
    );
    expect(response.status).toBe(201);
    const item = (await response.json()).item;
    expect(item.min_quantity).toBe(0);
    expect(
      (
        await stockItem.PUT(
          request(`stock-items/${item.id}`, "PUT", { quantity: 1 }),
          context(item.id),
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await stockItem.PUT(
          request(`stock-items/${item.id}`, "PUT", { quantity: -1 }),
          context(item.id),
        )
      ).status,
    ).toBe(400);
    response = await tasks.POST(
      request("tasks", "POST", {
        text: "Comprar material",
        category: "compras",
      }),
    );
    const taskId = (await response.json()).task.id;
    expect(
      (
        await task.PUT(
          request(`tasks/${taskId}`, "PUT", { done: true }),
          context(taskId),
        )
      ).status,
    ).toBe(200);
    expect(
      (await (await tasks.GET(request("tasks?category=salao"))).json()).tasks,
    ).toHaveLength(0);
    expect(
      (
        await goals.POST(
          request("monthly-goals", "POST", {
            year: 2026,
            month: 9,
            targetAmount: 0,
          }),
        )
      ).status,
    ).toBe(200);
    response = await financial.POST(
      request("financial-transactions", "POST", {
        type: "entrada",
        category: "Serviço",
        amount: 100,
        paid: false,
      }),
    );
    const id = (await response.json()).transaction.id;
    expect(
      (await (await financial.GET(request("financial-transactions"))).json())
        .summary.totalEntradas,
    ).toBe(0);
    expect(
      (
        await transaction.PUT(
          request(`financial-transactions/${id}`, "PUT", { paid: true }),
          context(id),
        )
      ).status,
    ).toBe(200);
    expect(
      (await (await financial.GET(request("financial-transactions"))).json())
        .summary.totalEntradas,
    ).toBe(100);
  });
});

describe("product catalog with real SQL", () => {
  const body = {
    name: "Mousse",
    category: "Finalizadores",
    description: "300 ml",
    price: 35.5,
    image_url: "https://example.test/mousse.jpg",
    active: true,
    available: true,
    display_order: 0,
  };
  it("publishes photos and prices, protects drafts and supports editing/hiding/restoring", async () => {
    const response = await products.POST(request("products", "POST", body));
    expect(response.status).toBe(201);
    const { product } = await response.json();
    await products.POST(
      request("products", "POST", { name: "Touca de cetim", active: false }),
    );
    state.admin = false;
    let listed = (await (await products.GET(request("products"))).json())
      .products;
    expect(listed).toHaveLength(1);
    expect(listed[0].image_url).toBe(body.image_url);
    expect(Number(listed[0].price)).toBe(35.5);
    state.admin = true;
    expect(
      (await (await products.GET(request("products?active=false"))).json())
        .products,
    ).toHaveLength(2);
    expect(
      (
        await productItem.PATCH(
          request("products/1", "PATCH", {
            name: "Mousse hidratante",
            price: null,
            available: false,
          }),
          context(product.id),
        )
      ).status,
    ).toBe(200);
    listed = (await (await products.GET(request("products"))).json()).products;
    expect(listed[0]).toMatchObject({
      name: "Mousse hidratante",
      price: null,
      available: false,
      image_url: body.image_url,
    });
    expect(
      (
        await productItem.DELETE(
          request("products/1", "DELETE"),
          context(product.id),
        )
      ).status,
    ).toBe(200);
    expect(
      (await (await products.GET(request("products"))).json()).products,
    ).toHaveLength(0);
    expect(
      (
        await productItem.PATCH(
          request("products/1", "PATCH", { active: true }),
          context(product.id),
        )
      ).status,
    ).toBe(200);
    expect((await state.db.query("SELECT * FROM products")).rows).toHaveLength(
      2,
    );
  });
  it("rejects publishing without a photo, invalid fields and unknown products", async () => {
    for (const input of [
      { ...body, image_url: "" },
      { ...body, image_url: "javascript:alert(1)" },
      { ...body, price: -1 },
      { ...body, active: "true" },
      { ...body, name: "  " },
      { ...body, display_order: -1 },
      { ...body, available: "false" },
      null,
    ])
      expect(
        (await products.POST(request("products", "POST", input))).status,
      ).toBe(400);
    expect(
      (
        await productItem.PATCH(
          request("products/999", "PATCH", { name: "Missing" }),
          context(999),
        )
      ).status,
    ).toBe(404);
    expect(
      (
        await productItem.DELETE(
          request("products/no", "DELETE"),
          context("no"),
        )
      ).status,
    ).toBe(400);
    expect((await state.db.query("SELECT * FROM products")).rows).toHaveLength(
      0,
    );
  });
  it("refuses new bookings before opening or after the new closing times", async () => {
    for (const input of [
      booking({ startTime: "09:00" }),
      booking({ startTime: "13:30" }),
      booking({ appointmentDate: "2099-09-25", startTime: "12:00" }),
    ])
      expect(
        (await appointments.POST(request("appointments", "POST", input)))
          .status,
      ).toBe(409);
    expect(
      (
        await appointments.POST(
          request(
            "appointments",
            "POST",
            booking({ appointmentDate: "2099-09-25", startTime: "11:30" }),
          ),
        )
      ).status,
    ).toBe(201);
  });
});

describe("galleries, persistent notifications and security", () => {
  const photo1 = "https://example.test/one.jpg",
    photo2 = "https://example.test/two.jpg";
  it("preserves ordered galleries and legacy cover edits for services and products", async () => {
    for (const [collection, item, name, data] of [
      [
        services,
        serviceItem,
        "services",
        { name: "Nagô", price: 80, duration_minutes: 60 },
      ],
      [
        products,
        productItem,
        "products",
        { name: "Gel", price: 20, active: true },
      ],
    ]) {
      const created = await collection.POST(
        request(name, "POST", { ...data, image_urls: [photo1, photo2] }),
      );
      expect(created.status).toBe(201);
      const record = (await created.json())[
        name === "services" ? "service" : "product"
      ];
      expect(record.image_urls).toEqual([photo1, photo2]);
      expect(record.image_url).toBe(photo1);
      expect(
        (
          await item.PATCH(
            request(name, "PATCH", {
              image_url: "https://example.test/new.jpg",
            }),
            context(record.id),
          )
        ).status,
      ).toBe(200);
      const listed = (await (await collection.GET(request(name))).json())[name];
      expect(listed.find((row) => row.id === record.id).image_urls).toEqual([
        "https://example.test/new.jpg",
        photo2,
      ]);
      const edited = await item.PATCH(
        request(name, "PATCH", { image_urls: [photo2, photo1] }),
        context(record.id),
      );
      expect(
        (await edited.json())[name === "services" ? "service" : "product"]
          .image_url,
      ).toBe(photo2);
      expect(
        (
          await item.PATCH(
            request(name, "PATCH", { image_urls: Array(9).fill(photo1) }),
            context(record.id),
          )
        ).status,
      ).toBe(400);
      expect(
        (
          await item.PATCH(
            request(name, "PATCH", { image_urls: ["javascript:alert(1)"] }),
            context(record.id),
          )
        ).status,
      ).toBe(400);
    }
  });
  it("uploads an image once and serves a stable bounded asset with MIME and cache protection", async () => {
    const image =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+kL9sAAAAASUVORK5CYII=";
    const result = await media.POST(request("media", "POST", { image }));
    expect(result.status).toBe(201);
    const { url } = await result.json(),
      id = url.split("/").at(-1);
    state.admin = false;
    const response = await mediaItem.GET(request("media/" + id), context(id));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("cache-control")).toContain("immutable");
    expect(Buffer.from(await response.arrayBuffer()).toString("base64")).toBe(
      image.split(",")[1],
    );
    const cached = new Request("http://localhost" + url, {
      headers: { "If-None-Match": response.headers.get("etag") },
    });
    expect((await mediaItem.GET(cached, context(id))).status).toBe(304);
    state.admin = true;
    for (const value of [
      "data:image/svg+xml;base64,PHN2Zy8+",
      "data:image/png;base64,PHNjcmlwdD4=",
      "https://example.test/image.jpg",
      "data:image/png;base64," + "A".repeat(2800001),
    ])
      expect(
        (await media.POST(request("media", "POST", { image: value }))).status,
      ).toBe(400);
  });
  it("notifies at three, reopens on quantity change, preserves unseen concurrent changes and resolves after restocking", async () => {
    const { item } = await (
      await stock.POST(
        request("stock-items", "POST", {
          name: "Gel de teste",
          quantity: 5,
          minQuantity: 0,
        }),
      )
    ).json();
    const update = (quantity) =>
      stockItem.PUT(
        request("stock-items/" + item.id, "PUT", { quantity }),
        context(item.id),
      );
    const list = async () => (await stockAlerts.GET()).json();
    expect((await list()).alerts).toHaveLength(0);
    await update(3);
    let current = await list();
    expect(current.unread).toBe(1);
    expect(current.alerts[0].quantity).toBe(3);
    const old = { id: item.id, version: current.alerts[0].version };
    expect(
      (
        await stockAlerts.PATCH(
          request("stock-alerts", "PATCH", { alerts: [old] }),
        )
      ).status,
    ).toBe(200);
    expect((await list()).unread).toBe(0);
    await update(2);
    await stockAlerts.PATCH(
      request("stock-alerts", "PATCH", { alerts: [old] }),
    );
    expect((await list()).unread).toBe(1);
    await update(7);
    expect((await list()).alerts).toHaveLength(0);
    await update(0);
    current = await list();
    expect(current.unread).toBe(1);
    expect(current.alerts[0].quantity).toBe(0);
    await stockItem.DELETE(
      request("stock-items/" + item.id, "DELETE"),
      context(item.id),
    );
    expect((await list()).alerts).toHaveLength(0);
  });
  it("uses a greater configured stock threshold and marks existing low-stock items", async () => {
    const { item } = await (
      await stock.POST(
        request("stock-items", "POST", {
          name: "Jumbo",
          quantity: 5,
          minQuantity: 6,
        }),
      )
    ).json();
    const current = await (await stockAlerts.GET()).json();
    expect(current.alerts[0]).toMatchObject({
      stock_item_id: item.id,
      threshold: 6,
    });
    expect((await (await dashboard.GET()).json()).lowStock).toHaveLength(1);
  });
  it("atomically limits repeated requests in SQL and expires a window without retaining raw IP addresses", async () => {
    const query = state.db.query.bind(state.db),
      secret = "test-secret-with-at-least-32-characters";
    const attempt = () =>
      consumeLimit("test", "192.0.2.10", 3, 900, query, secret);
    const results = await Promise.all(Array.from({ length: 8 }, attempt));
    expect(results.filter((result) => result.allowed)).toHaveLength(3);
    const rows = (await query("SELECT * FROM request_limits")).rows;
    expect(rows).toHaveLength(1);
    expect(rows[0].key_hash).toMatch(/^[a-f0-9]{64}$/);
    await query(
      "UPDATE request_limits SET expires_at = NOW() - INTERVAL '1 second'",
    );
    expect((await attempt()).allowed).toBe(true);
    expect(clientAddress("127.0.0.1", "1.2.3.4", 0)).toBe("127.0.0.1");
    expect(clientAddress("127.0.0.1", "spoofed, 192.0.2.10", 1)).toBe(
      "192.0.2.10",
    );
    expect(clientAddress("127.0.0.1", "invalid", 1)).toBe("127.0.0.1");
  });
});
