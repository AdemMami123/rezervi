const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addCustomerFieldsToReservations() {
  console.log('🔄 Adding customer fields to reservations table...');
  
  try {
    // Check if columns exist by trying a simple query
    const { data: testData, error: testError } = await supabase
      .from('reservations')
      .select('customer_name')
      .limit(1);
    
    if (testError && testError.message.includes('customer_name')) {
      console.log('📋 customer_name column does not exist. Please run this SQL in your Supabase SQL Editor:');
      console.log(`
-- Add customer fields to reservations table
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS customer_name text,
ADD COLUMN IF NOT EXISTS customer_phone text,
ADD COLUMN IF NOT EXISTS customer_email text;

-- Create indexes for better query performance  
CREATE INDEX IF NOT EXISTS idx_reservations_customer_name ON reservations(customer_name);
CREATE INDEX IF NOT EXISTS idx_reservations_customer_phone ON reservations(customer_phone);

-- Backfill existing reservations with customer data from users table (if linked)
UPDATE reservations 
SET 
    customer_name = users.full_name,
    customer_phone = users.phone,
    customer_email = users.email
FROM users 
WHERE reservations.client_id = users.id 
    AND reservations.customer_name IS NULL;
      `);
      return false;
    } else {
      console.log('✅ Customer fields already exist in reservations table');
      return true;
    }
  } catch (error) {
    console.error('❌ Error checking reservations table:', error);
    return false;
  }
}

if (require.main === module) {
  addCustomerFieldsToReservations();
}

module.exports = { addCustomerFieldsToReservations };