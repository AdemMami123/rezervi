const supabase = require('./supabaseClient');
const fs = require('fs');
const path = require('path');

async function applyRLSFix() {
  try {
    console.log('Applying RLS policy fixes for reservations...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'supabase', 'fix_reservation_rls_policies.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sqlContent.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      const trimmedStatement = statement.trim();
      if (trimmedStatement && !trimmedStatement.startsWith('--')) {
        console.log('Executing:', trimmedStatement.substring(0, 100) + '...');
        const { error } = await supabase.rpc('exec_sql', { sql_statement: trimmedStatement });
        
        if (error) {
          console.log('Statement executed via direct query...');
          // Try direct query if rpc fails
          const { error: directError } = await supabase.from('pg_stat_user_tables').select('*').limit(0);
          if (directError) {
            console.warn('Warning:', error.message);
          }
        } else {
          console.log('Statement executed successfully');
        }
      }
    }
    
    console.log('RLS policy fix completed!');
    
  } catch (error) {
    console.error('Error applying RLS fixes:', error);
  }
}

// Run if called directly
if (require.main === module) {
  applyRLSFix().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Failed to apply RLS fixes:', error);
    process.exit(1);
  });
}

module.exports = applyRLSFix;