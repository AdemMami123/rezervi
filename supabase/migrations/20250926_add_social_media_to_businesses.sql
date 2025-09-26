-- Migration to add social media fields to businesses table
-- Date: 2025-09-26

-- Add instagram_url column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' AND column_name = 'instagram_url'
    ) THEN
        ALTER TABLE businesses ADD COLUMN instagram_url text;
        COMMENT ON COLUMN businesses.instagram_url IS 'Instagram profile URL (optional)';
    END IF;
END $$;

-- Add facebook_url column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' AND column_name = 'facebook_url'
    ) THEN
        ALTER TABLE businesses ADD COLUMN facebook_url text;
        COMMENT ON COLUMN businesses.facebook_url IS 'Facebook profile URL (optional)';
    END IF;
END $$;

-- Add optional constraint to validate URL format (loose validation)
-- This ensures URLs start with http:// or https:// if provided
ALTER TABLE businesses 
ADD CONSTRAINT valid_instagram_url 
CHECK (
    instagram_url IS NULL OR 
    instagram_url = '' OR 
    instagram_url ~* '^https?://'
);

ALTER TABLE businesses 
ADD CONSTRAINT valid_facebook_url 
CHECK (
    facebook_url IS NULL OR 
    facebook_url = '' OR 
    facebook_url ~* '^https?://'
);