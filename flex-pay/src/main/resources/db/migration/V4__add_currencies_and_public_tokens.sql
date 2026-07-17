-- Drop single balance and currency columns and add usd_balance and khr_balance columns to wallets
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS usd_balance DECIMAL(19, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS khr_balance DECIMAL(19, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE wallets DROP COLUMN IF EXISTS balance;
ALTER TABLE wallets DROP COLUMN IF EXISTS currency;

-- Rename reference_number to transaction_no in transactions
ALTER TABLE transactions RENAME COLUMN reference_number TO transaction_no;

-- Add currency to transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'USD';

-- Create user_public_tokens table
CREATE TABLE IF NOT EXISTS user_public_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    public_token VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN NOT NULL DEFAULT TRUE
);
