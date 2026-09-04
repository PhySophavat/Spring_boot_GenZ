-- V10: Enforce strict 2-wallet multi-currency system (Main + Savings, USD + KHR)
-- 1. Ensure savings_khr_balance exists with NOT NULL and 0.00 default
ALTER TABLE wallets
    ADD COLUMN IF NOT EXISTS savings_khr_balance DECIMAL(19, 2) DEFAULT 0.00;

UPDATE wallets
SET savings_khr_balance = 0.00
WHERE savings_khr_balance IS NULL;

ALTER TABLE wallets
    ALTER COLUMN savings_khr_balance SET NOT NULL,
    ALTER COLUMN savings_khr_balance SET DEFAULT 0.00;

-- 2. Migrate any existing goal_usd_balance into savings_balance before removing legacy column
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='wallets' AND column_name='goal_usd_balance'
    ) THEN
        UPDATE wallets
        SET savings_balance = savings_balance + COALESCE(goal_usd_balance, 0.00);
        ALTER TABLE wallets DROP COLUMN goal_usd_balance;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='wallets' AND column_name='goal_khr_balance'
    ) THEN
        UPDATE wallets
        SET savings_khr_balance = savings_khr_balance + COALESCE(goal_khr_balance, 0.00);
        ALTER TABLE wallets DROP COLUMN goal_khr_balance;
    END IF;
END $$;
