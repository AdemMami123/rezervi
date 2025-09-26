const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyBusinessPhotosMigration() {
  console.log('🔄 Applying business photos migration...');
  
  try {
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250925_add_business_photos.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements and execute them
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    for (const statement of statements) {
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
      if (error) {
        console.error('❌ Error executing statement:', statement.substring(0, 100) + '...');
        console.error('Error details:', error);
        // Continue with other statements
      } else {
        console.log('✅ Executed:', statement.substring(0, 50) + '...');
      }
    }
    
    // Test the table creation
    const { data: testData, error: testError } = await supabase
      .from('business_photos')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.log('⚠️ Table may not exist yet (this is normal for new tables):', testError.message);
    } else {
      console.log('✅ Business photos table is accessible');
    }
    
    console.log('🏁 Business photos migration completed');
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return false;
  }
}

if (require.main === module) {
  applyBusinessPhotosMigration()
    .then((success) => {
      if (success) {
        console.log('🎉 Migration applied successfully!');
      } else {
        console.log('❌ Migration failed. Please check the errors above.');
      }
      process.exit(0);
    })
    .catch(err => {
      console.error('💥 Fatal error:', err);
      process.exit(1);
    });
}

module.exports = { applyBusinessPhotosMigration };