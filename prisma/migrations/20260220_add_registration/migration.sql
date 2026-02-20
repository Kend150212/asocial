-- Migration: add registration fields and otp_tokens table
-- Run on production: psql $DATABASE_URL -f this_file.sql

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS last_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS email_verified TIMESTAMP;

CREATE TABLE IF NOT EXISTS otp_tokens (
  id          VARCHAR(255) PRIMARY KEY,
  email       VARCHAR(255) NOT NULL,
  code        VARCHAR(10) NOT NULL,
  first_name  VARCHAR(255) NOT NULL,
  last_name   VARCHAR(255) NOT NULL,
  password    TEXT NOT NULL,
  expires_at  TIMESTAMP NOT NULL,
  used        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS otp_tokens_email_idx ON otp_tokens (email);
