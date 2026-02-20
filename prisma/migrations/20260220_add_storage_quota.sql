-- Add storage quota to plans (in MB, -1 = unlimited)
ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "max_storage_mb" INTEGER NOT NULL DEFAULT 512;

-- Update known plans with correct defaults
UPDATE "plans" SET "max_storage_mb" = 512   WHERE id = 'plan_free';
UPDATE "plans" SET "max_storage_mb" = 10240 WHERE id = 'plan_pro';
UPDATE "plans" SET "max_storage_mb" = 51200 WHERE id = 'plan_business';
UPDATE "plans" SET "max_storage_mb" = -1    WHERE id = 'plan_enterprise';

-- Also set AI text quota defaults while we're here
-- (in case 20260220_add_ai_text_quota.sql already ran; safe because IF NOT EXISTS above handles it)
UPDATE "plans" SET "max_ai_text_per_month" = 20   WHERE id = 'plan_free'       AND "max_ai_text_per_month" = 20;
UPDATE "plans" SET "max_ai_text_per_month" = 1000  WHERE id = 'plan_pro'        AND "max_ai_text_per_month" = 20;
UPDATE "plans" SET "max_ai_text_per_month" = 5000  WHERE id = 'plan_business'   AND "max_ai_text_per_month" = 20;
UPDATE "plans" SET "max_ai_text_per_month" = -1    WHERE id = 'plan_enterprise' AND "max_ai_text_per_month" = 20;
