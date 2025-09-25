-- Migration to add missing columns to businesses table
-- Date: 2025-09-25

-- Add phone column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' AND column_name = 'phone'
    ) THEN
        ALTER TABLE businesses ADD COLUMN phone text;
        COMMENT ON COLUMN businesses.phone IS 'Business phone number';
    END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE businesses ADD COLUMN updated_at timestamp default now();
        COMMENT ON COLUMN businesses.updated_at IS 'Timestamp when the business was last updated';
    END IF;
END $$;

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_businesses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists and recreate it
DROP TRIGGER IF EXISTS trigger_update_businesses_updated_at ON businesses;
CREATE TRIGGER trigger_update_businesses_updated_at
    BEFORE UPDATE ON businesses
    FOR EACH ROW
    EXECUTE FUNCTION update_businesses_updated_at();

-- Update existing records to have updated_at = created_at if updated_at is null
UPDATE businesses 
SET updated_at = created_at 
WHERE updated_at IS NULL;