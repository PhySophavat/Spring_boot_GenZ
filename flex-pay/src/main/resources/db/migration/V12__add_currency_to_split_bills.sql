-- V12: Add currency column to split_bills table
ALTER TABLE split_bills
    ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'USD';
