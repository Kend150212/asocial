-- Migration: Change require_approval from BOOLEAN to VARCHAR(10)
-- Run once on the server: psql $DATABASE_URL -f prisma/migrate-approval-mode.sql

-- Step 1: Add a temp column
ALTER TABLE "channels" ADD COLUMN "require_approval_new" VARCHAR(10) NOT NULL DEFAULT 'none';

-- Step 2: Convert existing boolean data
UPDATE "channels" SET "require_approval_new" = CASE
  WHEN "require_approval" = true THEN 'required'
  ELSE 'none'
END;

-- Step 3: Drop old boolean column
ALTER TABLE "channels" DROP COLUMN "require_approval";

-- Step 4: Rename new column
ALTER TABLE "channels" RENAME COLUMN "require_approval_new" TO "require_approval";
