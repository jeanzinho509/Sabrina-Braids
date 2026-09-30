const loopbackHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function parseHttpOrigin(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function requestOrigin(
  requestUrl,
  configuredUrl = process.env.AUTH_URL,
) {
  const incoming = new URL(requestUrl);
  const configured = parseHttpOrigin(configuredUrl);
  if (configuredUrl?.trim() && !configured)
    throw new Error(
      "AUTH_URL inválido. Use um endereço completo, como http://localhost:4000.",
    );
  // Loopback installations can use either local hostname and any selected port.
  // The Origin header must STILL match the actual request origin exactly.
  if (
    loopbackHosts.has(incoming.hostname) &&
    (!configured || loopbackHosts.has(new URL(configured).hostname))
  )
    return incoming.origin;
  if (!configured)
    throw new Error("AUTH_URL não configurado. Informe o endereço do site.");
  // Production proxies use the explicitly configured public origin. Never trust
  // arbitrary forwarded host/protocol headers to determine redirect or CSRF URLs.
  return configured;
}

export function allowedMutationOrigin(
  requestUrl,
  origin,
  fetchSite,
  configuredUrl = process.env.AUTH_URL,
) {
  const expected = requestOrigin(requestUrl, configuredUrl);
  if (fetchSite === "cross-site") return false;
  // Browser mutations must identify their origin, or explicitly be same-origin.
  return origin ? origin === expected : fetchSite === "same-origin";
}
