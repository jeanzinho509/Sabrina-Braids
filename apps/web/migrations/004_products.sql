-- Storefront catalog. Existing operational stock and appointments are preserved.
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(160) NOT NULL CHECK (length(trim(name)) > 0),
  description TEXT NOT NULL DEFAULT '',
  category VARCHAR(80) NOT NULL DEFAULT 'Cuidados capilares',
  price NUMERIC(12,2) CHECK (price > 0),
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT false,
  available BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (NOT active OR length(trim(image_url)) > 0 AND image_url IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS products_catalog_order ON products (active, display_order, name);
