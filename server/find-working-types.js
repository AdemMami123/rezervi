const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findWorkingTypes() {
  console.log('Testing each business type to find what the constraint allows...\n');
  
  // Test different possible variations of business types
  const typesToTest = [
    // Current frontend types
    'barbershop', 'beauty_salon', 'restaurant', 'cafe', 'football_field',
    'tennis_court', 'gym', 'car_wash', 'spa', 'dentist', 'doctor', 'other',
    
    // Possible alternative formats
    'Barbershop', 'Beauty Salon', 'Restaurant', 'Cafe', 'Football Field',
    'Tennis Court', 'Gym', 'Car Wash', 'Spa', 'Dentist', 'Doctor', 'Other',
    
    // With spaces instead of underscores
    'beauty salon', 'football field', 'tennis court', 'car wash',
    
    // Common variations
    'barber_shop', 'barber shop', 'salon', 'cafe_restaurant'
  ];

  const workingTypes = [];
  const failingTypes = [];

  for (const type of typesToTest) {
    try {
      const testData = {
        name: `Test ${type}`,
        type: type,
        location: 'Test Location',
        latitude: 36.8,
        longitude: 10.1,
        user_id: '00000000-0000-0000-0000-000000000000'
      };

      const { data, error } = await supabase
        .from('businesses')
        .insert([testData])
        .select();

      if (error) {
        failingTypes.push({ type, error: error.message });
        console.log(`❌ "${type}": ${error.message.substring(0, 50)}...`);
      } else {
        workingTypes.push(type);
        console.log(`✅ "${type}": OK`);
        // Clean up
        await supabase.from('businesses').delete().eq('id', data[0].id);
      }
    } catch (error) {
      failingTypes.push({ type, error: error.message });
      console.log(`❌ "${type}": ${error.message}`);
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log('\nWorking types:');
  workingTypes.forEach(type => console.log(`  - "${type}"`));
  
  console.log('\nFailing types:');
  failingTypes.forEach(({type, error}) => console.log(`  - "${type}": ${error.substring(0, 80)}...`));
}

findWorkingTypes();