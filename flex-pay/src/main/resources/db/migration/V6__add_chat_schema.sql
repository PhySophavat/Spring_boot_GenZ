-- ============================================================
-- V6: Chat schema + role column on users
-- ============================================================

-- 1. Add role column to existing users table (USER | ADMIN | SUPER_ADMIN)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS role          VARCHAR(20)  NOT NULL DEFAULT 'USER',
    ADD COLUMN IF NOT EXISTS profile_image VARCHAR(500);

-- 2. Chat user online/offline status
CREATE TABLE IF NOT EXISTS chat_user_status (
    user_id   BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    status    VARCHAR(10)  NOT NULL DEFAULT 'OFFLINE',
    last_seen TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Conversations
CREATE TABLE IF NOT EXISTS conversations (
    id         BIGSERIAL PRIMARY KEY,
    type       VARCHAR(20)  NOT NULL DEFAULT 'DIRECT',
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Conversation members
CREATE TABLE IF NOT EXISTS conversation_members (
    id              BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT    NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id         BIGINT    NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
    joined_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_members_conv ON conversation_members(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conv_members_user ON conversation_members(user_id);

-- 5. Messages
CREATE TABLE IF NOT EXISTS messages (
    id                  BIGSERIAL PRIMARY KEY,
    conversation_id     BIGINT      NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id           BIGINT      NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
    content             TEXT,
    message_type        VARCHAR(20) NOT NULL DEFAULT 'TEXT',
    reply_to_message_id BIGINT               REFERENCES messages(id)      ON DELETE SET NULL,
    is_edited           BOOLEAN     NOT NULL DEFAULT FALSE,
    is_deleted          BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender       ON messages(sender_id);

-- 6. Message read receipts
CREATE TABLE IF NOT EXISTS message_reads (
    id         BIGSERIAL PRIMARY KEY,
    message_id BIGINT    NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id    BIGINT    NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    read_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_message_reads_message ON message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_user    ON message_reads(user_id);

-- 7. Attachments
CREATE TABLE IF NOT EXISTS attachments (
    id         BIGSERIAL  PRIMARY KEY,
    message_id BIGINT       NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    file_name  VARCHAR(500) NOT NULL,
    file_url   VARCHAR(1000) NOT NULL,
    file_type  VARCHAR(100) NOT NULL,
    file_size  BIGINT       NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attachments_message ON attachments(message_id);
