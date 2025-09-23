-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time_slot TIME NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    payment_method VARCHAR(20) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'online')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'cash')),
    total_amount DECIMAL(10,2),
    discount_amount DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_business_id ON bookings(business_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Create unique constraint to prevent double bookings
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_unique_slot 
ON bookings(business_id, date, time_slot) 
WHERE status != 'cancelled';

-- Enable Row Level Security
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for bookings
-- Users can view their own bookings
CREATE POLICY "Users can view own bookings" ON bookings
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create bookings
CREATE POLICY "Users can create bookings" ON bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own bookings (only status changes like cancellation)
CREATE POLICY "Users can update own bookings" ON bookings
    FOR UPDATE USING (auth.uid() = user_id);

-- Business owners can view bookings for their businesses
CREATE POLICY "Business owners can view their business bookings" ON bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM businesses 
            WHERE businesses.id = bookings.business_id 
            AND businesses.user_id = auth.uid()
        )
    );

-- Business owners can update bookings for their businesses
CREATE POLICY "Business owners can update their business bookings" ON bookings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM businesses 
            WHERE businesses.id = bookings.business_id 
            AND businesses.user_id = auth.uid()
        )
    );

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_bookings_updated_at 
    BEFORE UPDATE ON bookings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data (optional - remove in production)
-- This assumes you have some businesses already created
/*
INSERT INTO bookings (business_id, user_id, date, time_slot, customer_name, customer_phone, customer_email, status, payment_method, payment_status) VALUES
-- You can add sample data here if needed for testing
*/
