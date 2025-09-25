-- Migration to add business_hours column to businesses table
-- Date: 2025-09-25

-- Add business_hours column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' AND column_name = 'business_hours'
    ) THEN
        ALTER TABLE businesses ADD COLUMN business_hours jsonb DEFAULT '{}';
        COMMENT ON COLUMN businesses.business_hours IS 'Weekly business hours as JSON object with days and times';
    END IF;
END $$;

-- Set default business hours for existing records that don't have any
UPDATE businesses 
SET business_hours = '{
    "monday": {"isOpen": false, "openTime": "09:00", "closeTime": "17:00"},
    "tuesday": {"isOpen": false, "openTime": "09:00", "closeTime": "17:00"},
    "wednesday": {"isOpen": false, "openTime": "09:00", "closeTime": "17:00"},
    "thursday": {"isOpen": false, "openTime": "09:00", "closeTime": "17:00"},
    "friday": {"isOpen": false, "openTime": "09:00", "closeTime": "17:00"},
    "saturday": {"isOpen": false, "openTime": "09:00", "closeTime": "17:00"},
    "sunday": {"isOpen": false, "openTime": "09:00", "closeTime": "17:00"}
}'::jsonb
WHERE business_hours = '{}'::jsonb OR business_hours IS NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_businesses_hours 
ON businesses USING GIN (business_hours);