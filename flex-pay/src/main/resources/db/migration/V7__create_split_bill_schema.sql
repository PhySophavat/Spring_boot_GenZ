-- ============================================================
-- V7: Split Bill schema + notification reference columns
-- ============================================================

-- 1. Create split_bills table
CREATE TABLE IF NOT EXISTS split_bills (
    id           BIGSERIAL PRIMARY KEY,
    creator_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_amount DECIMAL(19, 2) NOT NULL,
    split_type   VARCHAR(20) NOT NULL DEFAULT 'EQUAL',
    note         VARCHAR(255),
    status       VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_split_bills_creator ON split_bills(creator_id);
CREATE INDEX IF NOT EXISTS idx_split_bills_status  ON split_bills(status);

-- 2. Create split_bill_members table
CREATE TABLE IF NOT EXISTS split_bill_members (
    id                     BIGSERIAL PRIMARY KEY,
    split_bill_id          BIGINT NOT NULL REFERENCES split_bills(id) ON DELETE CASCADE,
    user_id                BIGINT NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
    amount                 DECIMAL(19, 2) NOT NULL,
    status                 VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    paid_at                TIMESTAMP,
    payment_transaction_id BIGINT REFERENCES transactions(id) ON DELETE SET NULL,
    created_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (split_bill_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_split_bill_members_split  ON split_bill_members(split_bill_id);
CREATE INDEX IF NOT EXISTS idx_split_bill_members_user   ON split_bill_members(user_id);
CREATE INDEX IF NOT EXISTS idx_split_bill_members_status ON split_bill_members(status);

-- 3. Add type and reference_id columns to notifications table
ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS type         VARCHAR(50) DEFAULT 'GENERAL',
    ADD COLUMN IF NOT EXISTS reference_id BIGINT;

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
