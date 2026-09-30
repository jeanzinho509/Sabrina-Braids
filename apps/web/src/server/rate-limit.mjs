import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { queryDatabase } from "./database.mjs";

export function clientAddress(remote, forwarded, trustedHops = 0) {
  const peer = isIP(remote || "") ? remote : "unknown";
  if (!Number.isInteger(trustedHops) || trustedHops < 1 || trustedHops > 5)
    return peer;
  const chain = [
    ...String(forwarded || "")
      .split(",")
      .map((ip) => ip.trim())
      .filter(Boolean),
    peer,
  ];
  const address = chain[chain.length - 1 - trustedHops];
  return isIP(address || "") ? address : peer;
}

export async function consumeLimit(
  scope,
  identity,
  maximum,
  seconds,
  query = queryDatabase,
  secret = process.env.AUTH_SECRET,
) {
  if (!secret) throw new Error("Rate limit requires the session secret");
  const key = createHmac("sha256", secret)
    .update(`${scope}:${identity}`)
    .digest("hex");
  // Atomic across workers and restarts. Raw IP addresses are never stored.
  const { rows } = await query(
    `INSERT INTO request_limits (key_hash, attempts, expires_at)
    VALUES ($1, 1, NOW() + $2 * INTERVAL '1 second')
    ON CONFLICT (key_hash) DO UPDATE SET
      attempts = CASE WHEN request_limits.expires_at <= NOW() THEN 1 ELSE request_limits.attempts + 1 END,
      expires_at = CASE WHEN request_limits.expires_at <= NOW() THEN NOW() + $2 * INTERVAL '1 second' ELSE request_limits.expires_at END
    RETURNING attempts, GREATEST(1, CEIL(EXTRACT(EPOCH FROM expires_at - NOW()))) AS retry_after`,
    [key, seconds],
  );
  await query(
    "DELETE FROM request_limits WHERE expires_at < NOW() - INTERVAL '1 day'",
  );
  return {
    allowed: Number(rows[0].attempts) <= maximum,
    retryAfter: Number(rows[0].retry_after),
  };
}
