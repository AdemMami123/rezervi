-- Migration to add business photos functionality
-- Date: 2025-09-25

-- Create business_photos table
CREATE TABLE IF NOT EXISTS business_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_business_photos_business_id ON business_photos(business_id);
CREATE INDEX IF NOT EXISTS idx_business_photos_display_order ON business_photos(business_id, display_order);
CREATE INDEX IF NOT EXISTS idx_business_photos_primary ON business_photos(business_id, is_primary) WHERE is_primary = true;

-- Ensure only one primary photo per business
CREATE UNIQUE INDEX IF NOT EXISTS idx_business_photos_unique_primary 
ON business_photos(business_id) 
WHERE is_primary = true;

-- Enable Row Level Security
ALTER TABLE business_photos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for business_photos
-- Business owners can manage their business photos
CREATE POLICY "Business owners can manage their business photos" ON business_photos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM businesses 
            WHERE businesses.id = business_photos.business_id 
            AND businesses.user_id = auth.uid()
        )
    );

-- Everyone can view business photos (for public business listings)
CREATE POLICY "Everyone can view business photos" ON business_photos
    FOR SELECT USING (true);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_business_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_business_photos_updated_at ON business_photos;
CREATE TRIGGER trigger_update_business_photos_updated_at
    BEFORE UPDATE ON business_photos
    FOR EACH ROW
    EXECUTE FUNCTION update_business_photos_updated_at();

-- Function to ensure only one primary photo per business
CREATE OR REPLACE FUNCTION ensure_single_primary_photo()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting a photo as primary, unset all other primary photos for this business
    IF NEW.is_primary = true THEN
        UPDATE business_photos 
        SET is_primary = false 
        WHERE business_id = NEW.business_id AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ensure_single_primary_photo ON business_photos;
CREATE TRIGGER trigger_ensure_single_primary_photo
    BEFORE INSERT OR UPDATE ON business_photos
    FOR EACH ROW
    WHEN (NEW.is_primary = true)
    EXECUTE FUNCTION ensure_single_primary_photo();