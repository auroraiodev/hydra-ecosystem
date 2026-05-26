-- ============================================================
-- Enable Row Level Security
-- ============================================================
-- Architecture:
--   service_role  — used by the NestJS backend (BYPASSRLS). Full access.
--   authenticated — future direct-access role; sees only own rows.
--   anon          — unauthenticated read access to public data.
--
-- The NestJS app connects as `postgres` (superuser) which already
-- bypasses RLS. Rename DATABASE_URL user to `service_role` once
-- that role is granted BYPASSRLS to make the bypass explicit.
-- ============================================================

-- ── Roles ────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role BYPASSRLS LOGIN PASSWORD 'change_me_in_prod';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
END $$;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO service_role, authenticated, anon;

-- service_role gets full table access
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;

-- ── Enable RLS ────────────────────────────────────────────────────────────────

-- Admin / config tables
ALTER TABLE admin_settings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE config                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags          ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles                  ENABLE ROW LEVEL SECURITY;

-- Public-read catalog tables
ALTER TABLE banners                ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories             ENABLE ROW LEVEL SECURITY;
ALTER TABLE conditions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE languages              ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_methods       ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE single_tags            ENABLE ROW LEVEL SECURITY;
ALTER TABLE tcgs                   ENABLE ROW LEVEL SECURITY;

-- Product / inventory tables
ALTER TABLE singles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings               ENABLE ROW LEVEL SECURITY;

-- User-owned tables
ALTER TABLE users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items             ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items_importation ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_shipping         ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments               ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens         ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews                ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions    ENABLE ROW LEVEL SECURITY;

-- ── service_role bypass policies ─────────────────────────────────────────────
-- Explicit full-access policies for the service role on every table.
-- These are redundant for postgres superuser but required when the app
-- is migrated to use the `service_role` user.

CREATE POLICY service_all ON admin_settings          TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_all ON config                  TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_all ON feature_flags           TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_all ON roles                   TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_all ON banners                 TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_all ON categories              TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_all ON conditions              TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_all ON languages               TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_all ON shipping_methods        TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_all ON tags                    TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_all ON single_tags             TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_all ON tcgs                    TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_all ON singles                 TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_all ON listings                TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_all ON users                   TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_all ON carts                   TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_all ON cart_items              TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_all ON chat_messages           TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_all ON notifications           TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_all ON orders                  TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_all ON order_items             TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_all ON order_items_importation TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_all ON order_shipping          TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_all ON payments                TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_all ON push_subscriptions      TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_all ON refresh_tokens          TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_all ON reviews                 TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_all ON user_addresses          TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_all ON wallet_transactions     TO service_role USING (true) WITH CHECK (true);

-- ── anon: public read-only access ─────────────────────────────────────────────
GRANT SELECT ON banners, categories, conditions, languages, shipping_methods,
                tags, single_tags, tcgs, singles, listings, reviews, roles
  TO anon;

CREATE POLICY anon_read ON banners          FOR SELECT TO anon USING (is_active = true);
CREATE POLICY anon_read ON categories       FOR SELECT TO anon USING (true);
CREATE POLICY anon_read ON conditions       FOR SELECT TO anon USING (true);
CREATE POLICY anon_read ON languages        FOR SELECT TO anon USING (true);
CREATE POLICY anon_read ON shipping_methods FOR SELECT TO anon USING (true);
CREATE POLICY anon_read ON tags             FOR SELECT TO anon USING (true);
CREATE POLICY anon_read ON single_tags      FOR SELECT TO anon USING (true);
CREATE POLICY anon_read ON tcgs             FOR SELECT TO anon USING (is_active = true);
CREATE POLICY anon_read ON singles          FOR SELECT TO anon USING (true);
CREATE POLICY anon_read ON listings         FOR SELECT TO anon USING (status = 'ACTIVE');
CREATE POLICY anon_read ON reviews          FOR SELECT TO anon USING (true);
CREATE POLICY anon_read ON roles            FOR SELECT TO anon USING (true);

-- ── authenticated: user sees own rows ─────────────────────────────────────────
-- Requires the app to set: SET LOCAL app.current_user_id = '<uuid>';
-- The NestJS app does NOT yet do this — these policies are ready for
-- when direct DB access via `authenticated` role is implemented.

GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON carts, cart_items TO authenticated;
GRANT SELECT ON chat_messages TO authenticated;
GRANT INSERT ON chat_messages TO authenticated;
GRANT SELECT, UPDATE ON notifications TO authenticated;
GRANT SELECT ON orders, order_items, order_items_importation, order_shipping TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_addresses TO authenticated;
GRANT SELECT, INSERT ON reviews TO authenticated;
GRANT SELECT ON wallet_transactions TO authenticated;
GRANT SELECT, INSERT ON push_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON listings TO authenticated;
GRANT SELECT ON singles TO authenticated;
GRANT SELECT ON payments TO authenticated;

CREATE POLICY user_own ON users FOR ALL TO authenticated
  USING (id = current_setting('app.current_user_id', true)::uuid)
  WITH CHECK (id = current_setting('app.current_user_id', true)::uuid);

CREATE POLICY user_own ON carts FOR ALL TO authenticated
  USING (user_id = current_setting('app.current_user_id', true)::uuid)
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);

CREATE POLICY user_own ON cart_items FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM carts c
    WHERE c.id = cart_items.cart_id
      AND c.user_id = current_setting('app.current_user_id', true)::uuid
  ));

CREATE POLICY user_own ON chat_messages FOR ALL TO authenticated
  USING (user_id = current_setting('app.current_user_id', true)::uuid)
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);

CREATE POLICY user_own ON notifications FOR ALL TO authenticated
  USING (user_id = current_setting('app.current_user_id', true)::uuid);

CREATE POLICY user_own ON orders FOR SELECT TO authenticated
  USING (user_id = current_setting('app.current_user_id', true)::uuid);

CREATE POLICY user_own ON order_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id
      AND o.user_id = current_setting('app.current_user_id', true)::uuid
  ));

CREATE POLICY user_own ON order_items_importation FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items_importation.order_id
      AND o.user_id = current_setting('app.current_user_id', true)::uuid
  ));

CREATE POLICY user_own ON order_shipping FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_shipping.order_id
      AND o.user_id = current_setting('app.current_user_id', true)::uuid
  ));

CREATE POLICY user_own ON payments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = payments.order_id
      AND o.user_id = current_setting('app.current_user_id', true)::uuid
  ));

CREATE POLICY user_own ON push_subscriptions FOR ALL TO authenticated
  USING (user_id = current_setting('app.current_user_id', true)::uuid)
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);

CREATE POLICY user_own ON reviews FOR ALL TO authenticated
  USING (user_id = current_setting('app.current_user_id', true)::uuid)
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);

CREATE POLICY user_own ON user_addresses FOR ALL TO authenticated
  USING (user_id = current_setting('app.current_user_id', true)::uuid)
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);

CREATE POLICY user_own ON wallet_transactions FOR SELECT TO authenticated
  USING (user_id = current_setting('app.current_user_id', true)::uuid);

CREATE POLICY user_own ON listings FOR ALL TO authenticated
  USING (user_id = current_setting('app.current_user_id', true)::uuid)
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);

-- sellers can read all active singles (catalog browsing)
CREATE POLICY read_all ON singles FOR SELECT TO authenticated USING (true);
