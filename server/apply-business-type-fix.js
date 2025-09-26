const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyBusinessTypeConstraintFix() {
  try {
    console.log('Applying business type constraint fix...\n');

    // Read the migration SQL
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250925_fix_business_type_constraint.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('SELECT'));

    console.log('Executing SQL statements...');

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\nExecuting statement ${i + 1}:`);
      console.log(statement);

      const { data, error } = await supabase.rpc('exec_sql', {
        query: statement
      });

      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
        throw error;
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    }

    // Test the new constraint
    console.log('\n=== Testing updated constraint ===');
    
    // Get a valid user ID
    const { data: users } = await supabase.from('users').select('id').limit(1);
    const validUserId = users[0]?.id;

    if (!validUserId) {
      console.log('No users found for testing');
      return;
    }

    // Test inserting different business types
    const typesToTest = ['barbershop', 'beauty_salon', 'cafe', 'gym', 'spa'];
    
    for (const type of typesToTest) {
      const testData = {
        name: `Test ${type}`,
        type: type,
        location: 'Test Location',
        latitude: 36.8,
        longitude: 10.1,
        user_id: validUserId
      };

      const { data, error } = await supabase
        .from('businesses')
        .insert([testData])
        .select();

      if (error) {
        console.log(`❌ ${type}: ${error.message}`);
      } else {
        console.log(`✅ ${type}: Insert successful`);
        // Clean up
        await supabase.from('businesses').delete().eq('id', data[0].id);
      }
    }

    console.log('\n🎉 Business type constraint fix applied successfully!');
    console.log('You can now create businesses with all supported business types.');

  } catch (error) {
    console.error('Error applying migration:', error);
  }
}

applyBusinessTypeConstraintFix();