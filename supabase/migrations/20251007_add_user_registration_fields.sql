-- Migration: Add username, phone_number, birthday, and email fields to users table
-- Date: 2025-10-07
-- Description: Enhances user registration with additional required fields

-- Step 1: Add new columns to users table (nullable first)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS username text,
ADD COLUMN IF NOT EXISTS phone_number text,
ADD COLUMN IF NOT EXISTS birthday date;

-- Step 2: Update existing users with default values BEFORE adding constraints
-- This prevents the "column contains null values" error
-- Get email from auth.users if not set
UPDATE users u
SET 
  email = COALESCE(u.email, (SELECT email FROM auth.users WHERE id = u.id)),
  username = COALESCE(u.username, 'user_' || substr(u.id::text, 1, 8)),
  phone_number = COALESCE(u.phone_number, ''),
  birthday = COALESCE(u.birthday, '2000-01-01'::date)
WHERE u.email IS NULL OR u.username IS NULL OR u.phone_number IS NULL OR u.birthday IS NULL;

-- Step 3: Now add constraints after data is populated
-- Email constraint: must be unique and not null
ALTER TABLE users
ADD CONSTRAINT users_email_unique UNIQUE (email);

ALTER TABLE users
ALTER COLUMN email SET NOT NULL;

-- Username constraint: must be unique and not null
ALTER TABLE users
ADD CONSTRAINT users_username_unique UNIQUE (username);

ALTER TABLE users
ALTER COLUMN username SET NOT NULL;

ALTER TABLE users
ALTER COLUMN phone_number SET NOT NULL;

ALTER TABLE users
ALTER COLUMN birthday SET NOT NULL;

-- Phone number constraint: basic format validation (allow empty for existing users)
ALTER TABLE users
ADD CONSTRAINT phone_number_format CHECK (phone_number = '' OR phone_number ~ '^\+?[0-9\s\-\(\)]+$');

-- Birthday constraint: must be a valid date in the past
ALTER TABLE users
ADD CONSTRAINT valid_birthday CHECK (birthday <= CURRENT_DATE AND birthday >= '1900-01-01');

-- Step 4: Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Add comments to table for documentation
COMMENT ON COLUMN users.email IS 'User email address (synced with auth.users)';
COMMENT ON COLUMN users.username IS 'Unique username for the user';
COMMENT ON COLUMN users.phone_number IS 'User phone number in international format';
COMMENT ON COLUMN users.birthday IS 'User date of birth';
