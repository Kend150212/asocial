-- AddColumn: max_ai_images_per_month to plans
ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "max_ai_images_per_month" INTEGER NOT NULL DEFAULT 0;

-- AddColumn: images_generated to usages
ALTER TABLE "usages" ADD COLUMN IF NOT EXISTS "images_generated" INTEGER NOT NULL DEFAULT 0;
