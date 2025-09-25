const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function applyMigration() {
  console.log('🔄 Applying database migration...');
  
  const migrationPath = path.join(__dirname, '../supabase/migrations/20250925_add_phone_updated_at_to_businesses.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  try {
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      return false;
    }
    
    console.log('✅ Migration applied successfully!');
    
    // Verify the columns were added
    const { data: testData, error: testError } = await supabase
      .from('businesses')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ Could not verify migration:', testError);
      return false;
    }
    
    if (testData.length > 0) {
      console.log('✅ Verified columns in businesses table:');
      console.log(Object.keys(testData[0]));
    } else {
      console.log('ℹ️ No businesses found to verify schema');
    }
    
    return true;
  } catch (err) {
    console.error('❌ Migration error:', err);
    return false;
  }
}

// Alternative method: direct SQL execution
async function applyMigrationDirect() {
  console.log('🔄 Applying migration with direct SQL execution...');
  
  try {
    // Check phone column
    const { error: phoneError } = await supabase
      .from('businesses')
      .select('phone')
      .limit(1);
      
    if (phoneError && phoneError.message.includes('does not exist')) {
      console.log('➕ Adding phone column...');
      console.log('⚠️ Please run the migration manually in Supabase dashboard SQL editor');
      console.log('Migration file: supabase/migrations/20250925_add_phone_updated_at_to_businesses.sql');
    } else {
      console.log('✅ Phone column already exists or accessible');
    }
    
    // Check business_hours column
    const { error: hoursError } = await supabase
      .from('businesses')
      .select('business_hours')
      .limit(1);
      
    if (hoursError && hoursError.message.includes('does not exist')) {
      console.log('➕ Adding business_hours column...');
      console.log('⚠️ Please run the migration manually in Supabase dashboard SQL editor');
      console.log('Migration file: supabase/migrations/20250925_add_business_hours_to_businesses.sql');
    } else {
      console.log('✅ Business hours column already exists or accessible');
    }
    
    // Test business data retrieval
    const { data: businesses, error: fetchError } = await supabase
      .from('businesses')
      .select('*')
      .limit(1);
    
    if (fetchError) {
      console.error('❌ Error fetching businesses:', fetchError);
      return false;
    }
    
    if (businesses.length > 0) {
      console.log('✅ Current business table columns:');
      console.log(Object.keys(businesses[0]));
      
      if (businesses[0].phone !== undefined) {
        console.log('✅ Phone column is accessible!');
      } else {
        console.log('❌ Phone column not found in business record');
      }
    } else {
      console.log('ℹ️ No businesses found to test');
    }
    
    return true;
  } catch (err) {
    console.error('❌ Error:', err);
    return false;
  }
}

if (require.main === module) {
  applyMigrationDirect()
    .then(() => {
      console.log('🏁 Migration check complete');
      process.exit(0);
    })
    .catch(err => {
      console.error('💥 Fatal error:', err);
      process.exit(1);
    });
}

module.exports = { applyMigration, applyMigrationDirect };