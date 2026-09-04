-- V13: Create otp_verifications table for registration and forgot-password flows
CREATE TABLE IF NOT EXISTS otp_verifications (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    purpose VARCHAR(30) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_otp_email_purpose ON otp_verifications (email, purpose);
