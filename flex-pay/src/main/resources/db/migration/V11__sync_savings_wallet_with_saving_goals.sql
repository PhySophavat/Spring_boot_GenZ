-- V11: Ensure Savings Wallet balance exactly equals the total saved across all saving goals
-- Any old mock balances are removed so Total Saved and Savings Wallet are 100% identical
UPDATE wallets w
SET savings_balance = COALESCE((
    SELECT SUM(current_amount) 
    FROM saving_goals g 
    WHERE g.user_id = w.user_id 
      AND g.status != 'CANCELLED'
), 0.00);

UPDATE wallets
SET savings_khr_balance = 0.00
WHERE savings_khr_balance = 500000.00 OR savings_khr_balance = 2000000.00;
