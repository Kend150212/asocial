-- Migration: Normalize require_approval values to 'none'/'optional'/'required'
-- Safe to run even if column is already text type

-- Set any remaining boolean-string 'true' to 'required', everything else to 'none'
UPDATE "channels"
SET "require_approval" = CASE
  WHEN "require_approval"::text IN ('true', 'required') THEN 'required'
  WHEN "require_approval"::text = 'optional' THEN 'optional'
  ELSE 'none'
END
WHERE "require_approval"::text NOT IN ('none', 'optional', 'required')
   OR "require_approval" IS NULL;
