-- Add profile_picture_url column to users table
-- This allows users to upload and store profile pictures

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN users.profile_picture_url IS 'URL to user profile picture stored in Supabase Storage';

-- No constraints needed - this is optional field
