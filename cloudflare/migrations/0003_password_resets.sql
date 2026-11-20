-- Email OTP password recovery (functions/_lib/sbauth.js routes otp/request, otp/resend, otp/verify, otp/reset).
-- Idempotent: safe to run more than once. Adds one new table and two indexes; no existing table or row is changed.
-- Codes and reset tokens are stored only as HMAC/SHA-256 hashes, never in plain form.
CREATE TABLE IF NOT EXISTS password_resets (
  id TEXT PRIMARY KEY,                 -- random request id (the browser keeps it between the steps)
  email TEXT NOT NULL,                 -- lower-case e-mail the request was made for
  user_id TEXT,                        -- auth_users.id, NULL when no eligible account (the request then never succeeds)
  otp_hash TEXT NOT NULL,              -- HMAC-SHA256(JWT_SECRET, id:code)
  reset_hash TEXT,                     -- SHA-256 of the one-time reset token handed out after a correct code
  status TEXT NOT NULL DEFAULT 'pending', -- pending | verified | used | locked | cancelled
  attempts INTEGER NOT NULL DEFAULT 0, -- wrong + right code entries (max 5)
  sends INTEGER NOT NULL DEFAULT 1,    -- e-mails sent for this request (first + resends)
  created_at INTEGER NOT NULL,         -- ms since epoch
  expires_at INTEGER NOT NULL,         -- current code valid until (ms)
  last_sent_at INTEGER NOT NULL,       -- last e-mail (resend allowed 60 s after it)
  verified_at INTEGER,
  reset_expires_at INTEGER,            -- reset token valid until (ms)
  used_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email, status);
CREATE INDEX IF NOT EXISTS idx_password_resets_created ON password_resets(created_at);
