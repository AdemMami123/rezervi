-- Create bookings table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional: links to registered user
    date DATE NOT NULL,
    time TIME NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    notes TEXT,
    payment_method VARCHAR(20) NOT NULL DEFAULT 'cash', -- 'cash' or 'online'
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'failed'
    amount DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed', -- 'confirmed', 'cancelled', 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_bookings_business_date ON bookings(business_id, date);
CREATE INDEX idx_bookings_date_time ON bookings(date, time);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_reviews_business ON reviews(business_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- Create RLS policies (if needed)
-- ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bookings_updated_at 
    BEFORE UPDATE ON bookings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
