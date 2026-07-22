-- V5: Add savings_balance column to wallets table
-- Step 1: Add as nullable first so existing rows don't cause NOT NULL violation
ALTER TABLE wallets
    ADD COLUMN IF NOT EXISTS savings_balance DECIMAL(19, 2);

-- Step 2: Backfill all existing rows with a default value
UPDATE wallets
SET savings_balance = 0.00
WHERE savings_balance IS NULL;

-- Step 3: Now apply NOT NULL and set a default for future rows
ALTER TABLE wallets
    ALTER COLUMN savings_balance SET NOT NULL,
    ALTER COLUMN savings_balance SET DEFAULT 0.00;
