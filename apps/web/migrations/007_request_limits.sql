CREATE TABLE request_limits (
  key_hash TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL CHECK (attempts > 0),
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX request_limits_expiry_idx ON request_limits (expires_at);
