-- Add AI text generation quota to plans and usage tracking
ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "max_ai_text_per_month" INTEGER NOT NULL DEFAULT 20;
ALTER TABLE "usages" ADD COLUMN IF NOT EXISTS "ai_text_generated" INTEGER NOT NULL DEFAULT 0;
