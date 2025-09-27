-- Migration: Add customer fields to reservations table
-- This adds fields to store customer information directly in reservations
-- for better data integrity and to support guest bookings

-- Add customer information fields to reservations table
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS customer_name text,
ADD COLUMN IF NOT EXISTS customer_phone text,
ADD COLUMN IF NOT EXISTS customer_email text;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reservations_customer_name ON reservations(customer_name);
CREATE INDEX IF NOT EXISTS idx_reservations_customer_phone ON reservations(customer_phone);

-- Backfill existing reservations with customer data from users table (if linked)
-- Note: users table only has full_name, no phone/email fields
UPDATE reservations 
SET 
    customer_name = users.full_name
FROM users 
WHERE reservations.client_id = users.id 
    AND reservations.customer_name IS NULL;

-- Comments
COMMENT ON COLUMN reservations.customer_name IS 'Customer name for display purposes, can be from user or guest booking';
COMMENT ON COLUMN reservations.customer_phone IS 'Customer phone for contact purposes';
COMMENT ON COLUMN reservations.customer_email IS 'Customer email for notifications';