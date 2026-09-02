-- ============================================================
-- V8: Social Payments Chat Schema
-- ============================================================

CREATE TABLE IF NOT EXISTS payment_transactions (
    id                    BIGSERIAL PRIMARY KEY,
    transaction_reference VARCHAR(50)  NOT NULL UNIQUE,
    conversation_id       BIGINT       NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id             BIGINT       NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
    receiver_id           BIGINT       NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
    amount                DECIMAL(19, 2) NOT NULL,
    message               VARCHAR(255),
    status                VARCHAR(20)  NOT NULL DEFAULT 'COMPLETED',
    created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_tx_conv     ON payment_transactions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_payment_tx_sender   ON payment_transactions(sender_id);
CREATE INDEX IF NOT EXISTS idx_payment_tx_receiver ON payment_transactions(receiver_id);
CREATE INDEX IF NOT EXISTS idx_payment_tx_status   ON payment_transactions(status);
