-- Migrate google_oauth from SOCIAL to AUTH category
UPDATE api_integrations
SET category = 'AUTH'
WHERE provider = 'google_oauth';

-- Insert if does not exist
INSERT INTO api_integrations (id, name, provider, category, status, config, is_default, created_at, updated_at)
SELECT
    gen_random_uuid(),
    'Google Sign-In (OAuth)',
    'google_oauth',
    'AUTH',
    'INACTIVE',
    '{}',
    false,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM api_integrations WHERE provider = 'google_oauth'
);
