-- Add aufenthaltsstatus column to bezugspersonen table
ALTER TABLE bezugspersonen
    ADD COLUMN IF NOT EXISTS aufenthaltsstatus VARCHAR(50);
