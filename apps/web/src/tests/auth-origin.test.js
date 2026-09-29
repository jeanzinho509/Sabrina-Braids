import { afterEach, describe, expect, it, vi } from "vitest";
import {
  allowedMutationOrigin,
  parseHttpOrigin,
  requestOrigin,
} from "../server/origin.mjs";
import { adminDestination, signInWithPassword } from "../utils/authClient";

const configured = "http://localhost:4000";
const actual = "http://127.0.0.1:4100";

describe("request origin", () => {
  it("uses the browser's local hostname and port, including in a production build", () => {
    for (const origin of [
      actual,
      "http://localhost:4200",
      "http://[::1]:4300",
    ]) {
      expect(requestOrigin(`${origin}/api/auth/csrf`, configured)).toBe(origin);
      expect(
        allowedMutationOrigin(
          `${origin}/api/appointments`,
          origin,
          "same-origin",
          configured,
        ),
      ).toBe(true);
    }
  });
  it("rejects foreign, null and wrong-port origins even on loopback", () => {
    for (const origin of [
      "https://attacker.example",
      "null",
      configured,
      "http://127.0.0.1:4101",
    ])
      expect(
        allowedMutationOrigin(
          `${actual}/api/appointments`,
          origin,
          "same-site",
          configured,
        ),
      ).toBe(false);
    expect(
      allowedMutationOrigin(
        `${actual}/api/appointments`,
        undefined,
        "cross-site",
        configured,
      ),
    ).toBe(false);
  });
  it("uses only the configured public origin behind a production proxy", () => {
    const publicOrigin = "https://salon.example";
    expect(
      requestOrigin("http://127.0.0.1:8080/api/auth/csrf", publicOrigin),
    ).toBe(publicOrigin);
    expect(
      allowedMutationOrigin(
        "http://127.0.0.1:8080/api/services",
        actual,
        undefined,
        publicOrigin,
      ),
    ).toBe(false);
    expect(
      allowedMutationOrigin(
        "http://127.0.0.1:8080/api/services",
        publicOrigin,
        "same-origin",
        publicOrigin,
      ),
    ).toBe(true);
  });
  it("reports malformed configuration instead of throwing an Invalid URL TypeError", () => {
    for (const value of [
      "localhost:4000",
      "undefined",
      "ftp://example.com",
      "https://user:pass@example.com",
    ])
      expect(parseHttpOrigin(value)).toBe(null);
    expect(() => requestOrigin(actual, "localhost:4000")).toThrow(
      "AUTH_URL inválido",
    );
  });
});

afterEach(() => vi.unstubAllGlobals());
const json = (value, status = 200) =>
  new Response(JSON.stringify(value), { status });
const credentials = {
  email: "review@example.test",
  password: "test password",
  callbackUrl: "/admin",
};

describe("login client", () => {
  it("shows the server's rejection without parsing an absent redirect URL", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(json({ csrfToken: "csrf" }))
        .mockResolvedValueOnce(json({ error: "Origem não autorizada." }, 403)),
    );
    await expect(signInWithPassword(credentials)).rejects.toThrow(
      "Origem não autorizada.",
    );
  });
  it("explains invalid credentials and rejects malformed or external redirects", async () => {
    for (const url of [
      undefined,
      "https://attacker.example",
      `${window.location.origin}/account/signin?error=CredentialsSignin`,
    ]) {
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockResolvedValueOnce(json({ csrfToken: "csrf" }))
          .mockResolvedValueOnce(json({ url })),
      );
      await expect(signInWithPassword(credentials)).rejects.toThrow(
        url?.includes("CredentialsSignin")
          ? "E-mail ou senha inválidos"
          : "endereço de retorno",
      );
    }
  });
  it("keeps callbacks inside the admin and upgrades old management links", () => {
    expect(adminDestination("/gestao/agenda?date=2026-10-01")).toBe(
      "/admin/gestao/agenda?date=2026-10-01",
    );
    for (const path of [
      "//evil.example",
      "https://evil.example",
      "/admin/../../account/logout",
      "/admin\\evil",
      "/agendar",
    ])
      expect(adminDestination(path)).toBe("/admin");
  });
});
