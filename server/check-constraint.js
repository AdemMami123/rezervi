const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabaseConstraint() {
  try {
    // Try to get the table schema information
    const { data, error } = await supabase
      .from('information_schema.check_constraints')
      .select('*')
      .ilike('constraint_name', '%type%');

    if (error) {
      console.error('Error fetching constraints:', error);
    } else {
      console.log('Check constraints:', JSON.stringify(data, null, 2));
    }

    // Try a direct query to see what happens
    console.log('\nTesting direct database insert...');
    const testBusinessData = {
      name: 'Test Business',
      type: 'barbershop',
      location: 'Test Location',
      latitude: 36.8,
      longitude: 10.1,
      user_id: '00000000-0000-0000-0000-000000000000'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('businesses')
      .insert([testBusinessData])
      .select();

    if (insertError) {
      console.error('Insert error:', insertError);
      console.error('Insert error details:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
    } else {
      console.log('Insert successful:', insertData);
      // Clean up
      await supabase.from('businesses').delete().eq('id', insertData[0].id);
    }

  } catch (error) {
    console.error('General error:', error);
  }
}

checkDatabaseConstraint();