-- Migration to set up business-images storage bucket with proper policies
-- Date: 2025-10-02
-- Purpose: Create storage bucket for business images and configure RLS policies

-- Note: Storage buckets need to be created via Supabase Dashboard or API
-- This script provides the storage policies only
-- To create the bucket, run this in the Supabase SQL Editor:

-- First, ensure the bucket exists (you may need to create it via Dashboard if this fails)
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('business-images', 'business-images', true)
-- ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (to allow re-running this script)
DROP POLICY IF EXISTS "Public Access to Business Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload business images" ON storage.objects;
DROP POLICY IF EXISTS "Business owners can update their business images" ON storage.objects;
DROP POLICY IF EXISTS "Business owners can delete their business images" ON storage.objects;

-- Policy 1: Allow public read access to all images in business-images bucket
-- This allows anyone to view business photos in the app
CREATE POLICY "Public Access to Business Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'business-images');

-- Policy 2: Allow authenticated users to upload images to business-images bucket
-- The business ownership will be validated at the application level
CREATE POLICY "Authenticated users can upload business images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'business-images' 
    AND auth.role() = 'authenticated'
);

-- Policy 3: Allow users to update their own business images
-- Images are named with pattern: business-{business_id}-{timestamp}-{index}.{ext}
-- This policy ensures users can only update images for businesses they own
CREATE POLICY "Business owners can update their business images"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'business-images'
    AND auth.role() = 'authenticated'
    AND (
        -- Extract business_id from the filename pattern and verify ownership
        EXISTS (
            SELECT 1 FROM businesses
            WHERE businesses.id::text = split_part(name, '-', 2)
            AND businesses.user_id = auth.uid()
        )
    )
);

-- Policy 4: Allow users to delete their own business images
-- Same ownership validation as update policy
CREATE POLICY "Business owners can delete their business images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'business-images'
    AND auth.role() = 'authenticated'
    AND (
        -- Extract business_id from the filename pattern and verify ownership
        EXISTS (
            SELECT 1 FROM businesses
            WHERE businesses.id::text = split_part(name, '-', 2)
            AND businesses.user_id = auth.uid()
        )
    )
);

-- INSTRUCTIONS FOR MANUAL SETUP:
-- ================================
-- 1. Go to Supabase Dashboard -> Storage
-- 2. Click "Create Bucket" or "New Bucket"
-- 3. Set the following:
--    - Name: business-images
--    - Public bucket: YES (check the box)
--    - File size limit: 5MB (optional, recommended)
--    - Allowed MIME types: image/* (optional, recommended)
-- 4. Click "Create Bucket"
-- 5. Then run this SQL script in the SQL Editor to set up the policies

-- After creating the bucket and running this script, your application will be able to:
-- ✅ Upload images during business registration
-- ✅ Upload additional images in business profile
-- ✅ Display images in business details modal
-- ✅ Display images in "My Business" section
-- ✅ Delete images (business owners only)
-- ✅ Public users can view all business images
