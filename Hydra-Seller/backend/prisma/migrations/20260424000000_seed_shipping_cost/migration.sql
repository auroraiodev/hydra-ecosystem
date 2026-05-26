INSERT INTO admin_settings (id, key, value, updated_at)
VALUES (gen_random_uuid(), 'shippingCost', '280', now())
ON CONFLICT (key) DO NOTHING;
