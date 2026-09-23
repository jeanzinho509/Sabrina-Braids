-- Additive baseline reconstructed from the application's SQL contracts.
-- No customer, service, price, password or sample booking is seeded.
CREATE TABLE IF NOT EXISTS auth_users (
  id SERIAL PRIMARY KEY, name TEXT, email TEXT UNIQUE NOT NULL, "emailVerified" TIMESTAMPTZ, image TEXT
);
CREATE TABLE IF NOT EXISTS auth_accounts (
  id SERIAL PRIMARY KEY, "userId" INTEGER NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, provider TEXT NOT NULL, "providerAccountId" TEXT NOT NULL,
  refresh_token TEXT, access_token TEXT, expires_at BIGINT, token_type TEXT, scope TEXT,
  id_token TEXT, session_state TEXT, password TEXT, UNIQUE(provider, "providerAccountId")
);
CREATE TABLE IF NOT EXISTS auth_sessions (
  id SERIAL PRIMARY KEY, "userId" INTEGER NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  "sessionToken" TEXT UNIQUE NOT NULL, expires TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS auth_verification_token (
  identifier TEXT NOT NULL, token TEXT NOT NULL, expires TIMESTAMPTZ NOT NULL, PRIMARY KEY(identifier, token)
);
CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY, name TEXT NOT NULL, description TEXT, price NUMERIC(12,2) NOT NULL CHECK(price > 0),
  duration_minutes INTEGER NOT NULL CHECK(duration_minutes > 0 AND duration_minutes <= 720),
  image_url TEXT, active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT, instagram TEXT,
  birthday DATE, notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY, client_name TEXT NOT NULL, client_phone TEXT NOT NULL, client_email TEXT,
  service_id INTEGER REFERENCES services(id), client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL, start_time TIME NOT NULL, end_time TIME NOT NULL,
  notes TEXT, custom_model_image TEXT, custom_model_description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','completed','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), CHECK(end_time > start_time)
);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS custom_model_image TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS custom_model_description TEXT;
ALTER TABLE appointments ALTER COLUMN service_id DROP NOT NULL;
CREATE TABLE IF NOT EXISTS time_blocks (
  id SERIAL PRIMARY KEY, block_date DATE NOT NULL, start_time TIME NOT NULL, end_time TIME NOT NULL,
  reason TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), CHECK(end_time > start_time)
);
CREATE TABLE IF NOT EXISTS gallery (
  id SERIAL PRIMARY KEY, image_url TEXT NOT NULL, caption TEXT, display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS videos (
  id SERIAL PRIMARY KEY, title TEXT, video_url TEXT NOT NULL, platform TEXT NOT NULL DEFAULT 'other',
  thumbnail_url TEXT, display_order INTEGER NOT NULL DEFAULT 0, active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS financial_transactions (
  id SERIAL PRIMARY KEY, type TEXT NOT NULL CHECK(type IN ('entrada','saida')), category TEXT NOT NULL,
  description TEXT, amount NUMERIC(12,2) NOT NULL CHECK(amount > 0), payment_method TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE, appointment_id INTEGER REFERENCES appointments(id),
  is_recurring BOOLEAN NOT NULL DEFAULT false, due_date DATE, paid BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS stock_items (
  id SERIAL PRIMARY KEY, name TEXT NOT NULL, quantity INTEGER NOT NULL DEFAULT 0 CHECK(quantity >= 0),
  min_quantity INTEGER NOT NULL DEFAULT 1 CHECK(min_quantity >= 0), unit TEXT NOT NULL DEFAULT 'un',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY, text TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'salao', done BOOLEAN NOT NULL DEFAULT false,
  priority BOOLEAN NOT NULL DEFAULT false, due_date DATE, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS monthly_goals (
  id SERIAL PRIMARY KEY, year INTEGER NOT NULL, month INTEGER NOT NULL CHECK(month BETWEEN 1 AND 12),
  target_amount NUMERIC(12,2) NOT NULL CHECK(target_amount >= 0), UNIQUE(year, month)
);
CREATE INDEX IF NOT EXISTS appointments_date_idx ON appointments(appointment_date, status);
CREATE INDEX IF NOT EXISTS appointments_client_idx ON appointments(client_id);
CREATE INDEX IF NOT EXISTS financial_date_idx ON financial_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS time_blocks_date_idx ON time_blocks(block_date);
