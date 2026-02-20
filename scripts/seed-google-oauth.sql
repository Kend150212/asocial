/**
 * Insert google_oauth integration row via Prisma CLI (reads .env automatically)
 * Run on the server with:
 *   npx prisma db execute --file=scripts/seed-google-oauth.sql --schema=prisma/schema.prisma
 */

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
