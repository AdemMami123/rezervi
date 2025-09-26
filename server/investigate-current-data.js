const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function investigateCurrentData() {
  try {
    // Get existing businesses to see what types actually work
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('id, name, type, user_id');

    if (error) {
      console.error('Error fetching existing businesses:', error);
      return;
    }

    console.log('Existing businesses in database:');
    console.log(JSON.stringify(businesses, null, 2));

    if (businesses.length > 0) {
      console.log('\nUnique business types that work:');
      const uniqueTypes = [...new Set(businesses.map(b => b.type))];
      uniqueTypes.forEach(type => console.log(`  - "${type}"`));
    }

    // Try to insert without the user_id constraint that might be causing issues
    console.log('\nTesting insert without user constraint...');
    
    // First, let's see if there's a user we can use
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (!userError && users.length > 0) {
      const validUserId = users[0].id;
      console.log(`Found valid user ID: ${validUserId}`);

      // Try inserting with a valid user ID
      const testData = {
        name: 'Test Business',
        type: 'restaurant', // This is the one type that worked before
        location: 'Test Location',
        latitude: 36.8,
        longitude: 10.1,
        user_id: validUserId
      };

      const { data: insertData, error: insertError } = await supabase
        .from('businesses')
        .insert([testData])
        .select();

      if (insertError) {
        console.error('Insert with valid user failed:', insertError);
      } else {
        console.log('Success! Inserted with valid user:', insertData);
        // Clean up
        await supabase.from('businesses').delete().eq('id', insertData[0].id);
      }
    } else {
      console.log('No users found in database:', userError);
    }

  } catch (error) {
    console.error('General error:', error);
  }
}

investigateCurrentData();