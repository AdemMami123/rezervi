const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkBusinessTypesConstraint() {
  try {
    // Check what business types currently exist
    const { data: businesses, error: businessError } = await supabase
      .from('businesses')
      .select('type')
      .limit(20);

    if (!businessError) {
      console.log('Existing business types in database:');
      const types = [...new Set(businesses.map(b => b.type))];
      console.log(types);
    } else {
      console.error('Error fetching businesses:', businessError);
    }

    // Try to insert a test business type to see what the constraint allows
    console.log('\nTesting business type constraint...');
    
    const testTypes = [
      'barbershop', 'beauty_salon', 'restaurant', 'cafe', 'football_field', 
      'tennis_court', 'gym', 'car_wash', 'spa', 'dentist', 'doctor', 'other'
    ];

    for (const type of testTypes) {
      try {
        const { data, error } = await supabase
          .from('businesses')
          .insert({
            name: `Test ${type}`,
            type: type,
            location: 'Test Location',
            latitude: 36.8,
            longitude: 10.1,
            user_id: '00000000-0000-0000-0000-000000000000' // dummy UUID
          })
          .select();
        
        console.log(`✅ ${type}: OK`);
        
        // Clean up the test record
        if (data && data[0]) {
          await supabase.from('businesses').delete().eq('id', data[0].id);
        }
      } catch (testError) {
        console.log(`❌ ${type}: ${testError.message}`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkBusinessTypesConstraint();