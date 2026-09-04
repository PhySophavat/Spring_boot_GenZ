-- V9__create_savings_schema.sql
-- Schema for Flex Pay Savings Feature: Goals, Transactions, Reminders, and Streaks

CREATE TABLE IF NOT EXISTS saving_goals (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(150) NOT NULL,
    icon VARCHAR(50) DEFAULT '🎯',
    category VARCHAR(100) NOT NULL,
    target_amount DECIMAL(19, 4) NOT NULL,
    current_amount DECIMAL(19, 4) NOT NULL DEFAULT 0.0000,
    target_date DATE NOT NULL,
    description VARCHAR(500),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_saving_goals_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_saving_goals_user ON saving_goals (user_id);
CREATE INDEX IF NOT EXISTS idx_saving_goals_status ON saving_goals (status);

CREATE TABLE IF NOT EXISTS saving_transactions (
    id BIGSERIAL PRIMARY KEY,
    goal_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    amount DECIMAL(19, 4) NOT NULL,
    type VARCHAR(30) NOT NULL, -- ADD or WITHDRAW
    note VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_saving_tx_goal FOREIGN KEY (goal_id) REFERENCES saving_goals (id) ON DELETE CASCADE,
    CONSTRAINT fk_saving_tx_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_saving_tx_goal ON saving_transactions (goal_id);
CREATE INDEX IF NOT EXISTS idx_saving_tx_user ON saving_transactions (user_id);

CREATE TABLE IF NOT EXISTS saving_reminders (
    id BIGSERIAL PRIMARY KEY,
    goal_id BIGINT NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    frequency VARCHAR(30) NOT NULL DEFAULT 'WEEKLY', -- DAILY, WEEKLY, MONTHLY
    amount DECIMAL(19, 4) NOT NULL DEFAULT 10.0000,
    reminder_time VARCHAR(20) NOT NULL DEFAULT '20:00',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_saving_reminder_goal FOREIGN KEY (goal_id) REFERENCES saving_goals (id) ON DELETE CASCADE,
    CONSTRAINT fk_saving_reminder_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_saving_reminder_user ON saving_reminders (user_id);

CREATE TABLE IF NOT EXISTS saving_streaks (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    current_streak INT NOT NULL DEFAULT 0,
    best_streak INT NOT NULL DEFAULT 0,
    last_saving_date DATE,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_saving_streak_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_saving_streak_user ON saving_streaks (user_id);
