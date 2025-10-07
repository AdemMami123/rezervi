-- SAFER Migration: Add username, phone_number, and birthday fields to users table
-- Date: 2025-10-07
-- Description: Enhances user registration with additional required fields
-- This version handles existing data more carefully

-- Step 1: Check if columns already exist and add them if not
DO $$ 
BEGIN
    -- Add username column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='username') THEN
        ALTER TABLE users ADD COLUMN username text;
    END IF;
    
    -- Add phone_number column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='phone_number') THEN
        ALTER TABLE users ADD COLUMN phone_number text;
    END IF;
    
    -- Add birthday column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='birthday') THEN
        ALTER TABLE users ADD COLUMN birthday date;
    END IF;
END $$;

-- Step 2: Update existing users with default values
-- Generate unique usernames based on user ID
UPDATE users
SET username = 'user_' || substr(id::text, 1, 8)
WHERE username IS NULL;

-- Set default phone number (empty string or a placeholder)
UPDATE users
SET phone_number = ''
WHERE phone_number IS NULL;

-- Set default birthday (you may want to adjust this date)
UPDATE users
SET birthday = '2000-01-01'::date
WHERE birthday IS NULL;

-- Step 3: Add constraints AFTER data is populated
-- Drop existing constraints if they exist (in case of re-running)
DO $$ 
BEGIN
    -- Drop unique constraint if exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_username_unique') THEN
        ALTER TABLE users DROP CONSTRAINT users_username_unique;
    END IF;
    
    -- Drop phone format constraint if exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'phone_number_format') THEN
        ALTER TABLE users DROP CONSTRAINT phone_number_format;
    END IF;
    
    -- Drop birthday constraint if exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_birthday') THEN
        ALTER TABLE users DROP CONSTRAINT valid_birthday;
    END IF;
END $$;

-- Now add the constraints
ALTER TABLE users
ADD CONSTRAINT users_username_unique UNIQUE (username);

ALTER TABLE users
ALTER COLUMN username SET NOT NULL;

ALTER TABLE users
ALTER COLUMN phone_number SET NOT NULL;

ALTER TABLE users
ALTER COLUMN birthday SET NOT NULL;

-- Phone number constraint: basic format validation
-- Allow empty string for existing users, but new registrations will validate properly
ALTER TABLE users
ADD CONSTRAINT phone_number_format CHECK (
    phone_number = '' OR 
    phone_number ~ '^\+?[0-9\s\-\(\)]+$'
);

-- Birthday constraint: must be a valid date in the past
ALTER TABLE users
ADD CONSTRAINT valid_birthday CHECK (
    birthday <= CURRENT_DATE AND 
    birthday >= '1900-01-01'
);

-- Step 4: Create index on username for faster lookups
DROP INDEX IF EXISTS idx_users_username;
CREATE INDEX idx_users_username ON users(username);

-- Step 5: Add comments for documentation
COMMENT ON COLUMN users.username IS 'Unique username for the user';
COMMENT ON COLUMN users.phone_number IS 'User phone number in international format';
COMMENT ON COLUMN users.birthday IS 'User date of birth';

-- Verification: Show updated table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
