-- Preserve existing covers and add ordered photo galleries.
ALTER TABLE services ADD COLUMN image_urls TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE products ADD COLUMN image_urls TEXT[] NOT NULL DEFAULT '{}';
UPDATE services SET image_urls = ARRAY[image_url] WHERE COALESCE(image_url, '') <> '';
UPDATE products SET image_urls = ARRAY[image_url] WHERE COALESCE(image_url, '') <> '';
ALTER TABLE services ADD CONSTRAINT services_photo_count CHECK (cardinality(image_urls) <= 8);
ALTER TABLE products ADD CONSTRAINT products_photo_count CHECK (cardinality(image_urls) <= 8);

-- New uploads are served individually, without embedding every photo in catalog JSON.
CREATE TABLE media_assets (
  id UUID PRIMARY KEY,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  content BYTEA NOT NULL CHECK (octet_length(content) BETWEEN 1 AND 2097152),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
