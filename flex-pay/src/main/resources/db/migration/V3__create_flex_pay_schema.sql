-- Alter users table to align with requirements
ALTER TABLE users RENAME COLUMN phone TO phone_number;
ALTER TABLE users RENAME COLUMN password TO password_hash;

ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS pin_hash VARCHAR(255),
    ADD COLUMN IF NOT EXISTS pin_created BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS pin_failed_attempts INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS pin_lock_expires_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS pin_verified BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS last_pin_verified_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'ACTIVE',
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create wallets table
CREATE TABLE IF NOT EXISTS wallets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    wallet_id VARCHAR(50) NOT NULL UNIQUE,
    wallet_number VARCHAR(6) NOT NULL UNIQUE,
    balance DECIMAL(19, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    reference_number VARCHAR(50) NOT NULL UNIQUE,
    sender_wallet_id BIGINT REFERENCES wallets(id),
    receiver_wallet_id BIGINT REFERENCES wallets(id),
    amount DECIMAL(19, 2) NOT NULL,
    fee DECIMAL(19, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(19, 2) NOT NULL,
    note VARCHAR(255),
    transaction_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message VARCHAR(255) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
