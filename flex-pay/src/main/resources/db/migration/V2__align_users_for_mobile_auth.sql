ALTER TABLE users
    ALTER COLUMN email DROP NOT NULL;

UPDATE users
SET phone = CONCAT('temp-', id)
WHERE phone IS NULL OR BTRIM(phone) = '';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'uk_users_phone'
    ) THEN
        ALTER TABLE users
            ADD CONSTRAINT uk_users_phone UNIQUE (phone);
    END IF;
END $$;

ALTER TABLE users
    ALTER COLUMN phone SET NOT NULL;
