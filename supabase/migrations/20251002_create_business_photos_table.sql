-- Migration: Create business_photos table
-- Date: October 2, 2025
-- Description: Creates the business_photos table to store business images

-- Create the business_photos table
CREATE TABLE IF NOT EXISTS public.business_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_business_photos_business_id ON public.business_photos(business_id);
CREATE INDEX IF NOT EXISTS idx_business_photos_display_order ON public.business_photos(business_id, display_order);

-- Enable Row Level Security
ALTER TABLE public.business_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can view business photos (public read)
CREATE POLICY "Anyone can view business photos"
ON public.business_photos
FOR SELECT
USING (true);

-- RLS Policy: Authenticated users can insert photos for their own business
CREATE POLICY "Business owners can insert photos"
ON public.business_photos
FOR INSERT
WITH CHECK (
    auth.uid() IN (
        SELECT user_id FROM public.businesses WHERE id = business_id
    )
);

-- RLS Policy: Business owners can update their own photos
CREATE POLICY "Business owners can update their photos"
ON public.business_photos
FOR UPDATE
USING (
    auth.uid() IN (
        SELECT user_id FROM public.businesses WHERE id = business_id
    )
);

-- RLS Policy: Business owners can delete their own photos
CREATE POLICY "Business owners can delete their photos"
ON public.business_photos
FOR DELETE
USING (
    auth.uid() IN (
        SELECT user_id FROM public.businesses WHERE id = business_id
    )
);

-- Add a trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_business_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_business_photos_timestamp
BEFORE UPDATE ON public.business_photos
FOR EACH ROW
EXECUTE FUNCTION update_business_photos_updated_at();

-- Comment on table
COMMENT ON TABLE public.business_photos IS 'Stores photos for businesses uploaded to Supabase storage';
COMMENT ON COLUMN public.business_photos.business_id IS 'Foreign key to businesses table';
COMMENT ON COLUMN public.business_photos.photo_url IS 'Full URL to the photo in Supabase storage';
COMMENT ON COLUMN public.business_photos.display_order IS 'Order in which photos should be displayed';
COMMENT ON COLUMN public.business_photos.is_primary IS 'Whether this is the primary/featured photo';
