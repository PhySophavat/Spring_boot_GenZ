-- V14: Add email verification and reset token support
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE otp_verifications ADD COLUMN IF NOT EXISTS attempts INT NOT NULL DEFAULT 0;
ALTER TABLE otp_verifications ADD COLUMN IF NOT EXISTS max_attempts INT NOT NULL DEFAULT 5;
ALTER TABLE otp_verifications ADD COLUMN IF NOT EXISTS reset_token VARCHAR(100);
ALTER TABLE otp_verifications ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMP;
ALTER TABLE otp_verifications ADD COLUMN IF NOT EXISTS last_resent_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_otp_reset_token ON otp_verifications (reset_token);
