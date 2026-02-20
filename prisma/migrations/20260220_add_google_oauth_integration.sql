-- Insert Google OAuth integration into ApiIntegration table if not already present
INSERT INTO "ApiIntegration" (id, name, provider, category, status, config, "isDefault", "createdAt", "updatedAt")
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
    SELECT 1 FROM "ApiIntegration" WHERE provider = 'google_oauth'
);
