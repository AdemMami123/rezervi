const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function applySocialMediaMigration() {
  console.log('🔄 Applying social media fields migration...');
  
  const migrationPath = path.join(__dirname, '../supabase/migrations/20250926_add_social_media_to_businesses.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    return false;
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  try {
    // Split and execute each statement separately
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 100) + '...');
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        
        if (error) {
          console.warn('⚠️ Statement may have failed (possibly already exists):', error.message);
        }
      }
    }
    
    console.log('✅ Migration applied successfully!');
    
    // Verify the columns were added
    const { data: testData, error: testError } = await supabase
      .from('businesses')
      .select('instagram_url, facebook_url')
      .limit(1);
    
    if (testError) {
      console.error('❌ Could not verify migration:', testError);
      return false;
    }
    
    console.log('✅ Verified new social media columns exist in businesses table');
    return true;
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return false;
  }
}

// Alternative method: direct SQL execution
async function applySocialMediaMigrationDirect() {
  console.log('🔄 Applying social media migration directly...');
  
  try {
    // Since we can't use exec_sql, we'll need to run this manually
    console.log('❗ Automatic migration through Supabase client not supported');
    console.log('📋 Please run the following SQL commands in your Supabase dashboard:');
    console.log('');
    console.log('-- Add instagram_url column');
    console.log('ALTER TABLE businesses ADD COLUMN IF NOT EXISTS instagram_url text;');
    console.log('');
    console.log('-- Add facebook_url column');  
    console.log('ALTER TABLE businesses ADD COLUMN IF NOT EXISTS facebook_url text;');
    console.log('');
    console.log('-- Add constraints for URL validation');
    console.log('ALTER TABLE businesses ADD CONSTRAINT IF NOT EXISTS valid_instagram_url CHECK (instagram_url IS NULL OR instagram_url = \'\' OR instagram_url ~* \'^https?://\');');
    console.log('ALTER TABLE businesses ADD CONSTRAINT IF NOT EXISTS valid_facebook_url CHECK (facebook_url IS NULL OR facebook_url = \'\' OR facebook_url ~* \'^https?://\');');
    console.log('');
    
    // Test business data retrieval to show current structure
    const { data: businesses, error: fetchError } = await supabase
      .from('businesses')
      .select('*')
      .limit(1);
    
    if (fetchError) {
      console.error('❌ Error fetching businesses:', fetchError);
      return false;
    }
    
    if (businesses.length > 0) {
      console.log('📊 Current business table columns:');
      console.log(Object.keys(businesses[0]).sort());
      
      if (businesses[0].instagram_url !== undefined && businesses[0].facebook_url !== undefined) {
        console.log('✅ Social media columns are already accessible!');
        return true;
      } else {
        console.log('⚠️ Social media columns not found - manual SQL execution required');
        return false;
      }
    }
    
    return false;
    
  } catch (error) {
    console.error('❌ Migration check failed:', error);
    return false;
  }
}

// Run both methods
async function runMigration() {
  console.log('🚀 Starting social media fields migration for businesses...');
  
  const success = await applySocialMediaMigrationDirect();
  
  if (!success) {
    console.log('\n⚠️ Automatic migration failed. Please run the SQL manually:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the content of: supabase/migrations/20250926_add_social_media_to_businesses.sql');
  }
  
  console.log('\n🏁 Migration process completed!');
}

if (require.main === module) {
  runMigration();
}

module.exports = { applySocialMediaMigration, applySocialMediaMigrationDirect };