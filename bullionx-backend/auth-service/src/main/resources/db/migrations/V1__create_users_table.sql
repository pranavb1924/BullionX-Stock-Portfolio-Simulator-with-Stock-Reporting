-- 1. Enable pgcrypto for bcrypt support
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Create the users table
CREATE TABLE IF NOT EXISTS users (
  first_name                  VARCHAR(100)    NOT NULL,
  last_name                   VARCHAR(100)    NOT NULL,
  email                       VARCHAR(255)    PRIMARY KEY,
  password_hash               TEXT            NOT NULL,
  created_at                  TIMESTAMP       NOT NULL DEFAULT NOW(),
  email_verified              BOOLEAN         NOT NULL DEFAULT FALSE,
  email_verification_code     VARCHAR(6),
  email_verification_expires  TIMESTAMP,
  reset_token                 TEXT,
  reset_expires               TIMESTAMP
);
