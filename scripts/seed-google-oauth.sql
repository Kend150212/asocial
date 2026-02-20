INSERT INTO "api_integrations" (id, name, provider, category, status, config, "isDefault", "createdAt", "updatedAt")
SELECT
    gen_random_uuid(),
    'Google Sign-In (OAuth)',
    'google_oauth',
    'OAuth',
    'INACTIVE',
    '{}',
    false,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM "api_integrations" WHERE provider = 'google_oauth'
);
