-- Migration: add_channel_invites_customer_portal
-- Run on server: psql $DATABASE_URL -f this_file.sql

-- ChannelInvite table
CREATE TABLE IF NOT EXISTS "channel_invites" (
  "id"           TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "channel_id"   TEXT NOT NULL REFERENCES "channels"("id") ON DELETE CASCADE,
  "email"        TEXT NOT NULL,
  "name"         TEXT,
  "token"        TEXT NOT NULL UNIQUE,
  "expires_at"   TIMESTAMP(3) NOT NULL,
  "accepted_at"  TIMESTAMP(3),
  "user_id"      TEXT,
  "invited_by"   TEXT NOT NULL,
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "channel_invites_channel_id_email_key" UNIQUE ("channel_id", "email")
);

-- Add user relation to post_approvals (user_id column already exists but no FK)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'post_approvals_user_id_fkey'
  ) THEN
    ALTER TABLE "post_approvals"
      ADD CONSTRAINT "post_approvals_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id");
  END IF;
END $$;
