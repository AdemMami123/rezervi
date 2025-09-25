const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function setupBusinessHours() {
  console.log('🔄 Setting up business hours...');
  
  try {
    // Try to select business_hours to see if it exists
    const { error: testError } = await supabase
      .from('businesses')
      .select('business_hours')
      .limit(1);
    
    if (testError && testError.message.includes('does not exist')) {
      console.log('❌ business_hours column does not exist.');
      console.log('📋 Please run this SQL in your Supabase SQL Editor:');
      console.log(`
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS business_hours jsonb DEFAULT '{}';

UPDATE businesses 
SET business_hours = '{
  "monday": {"isOpen": false, "openTime": "09:00", "closeTime": "17:00"},
  "tuesday": {"isOpen": false, "openTime": "09:00", "closeTime": "17:00"},
  "wednesday": {"isOpen": false, "openTime": "09:00", "closeTime": "17:00"},
  "thursday": {"isOpen": false, "openTime": "09:00", "closeTime": "17:00"},
  "friday": {"isOpen": false, "openTime": "09:00", "closeTime": "17:00"},
  "saturday": {"isOpen": false, "openTime": "09:00", "closeTime": "17:00"},
  "sunday": {"isOpen": false, "openTime": "09:00", "closeTime": "17:00"}
}'::jsonb
WHERE business_hours = '{}'::jsonb OR business_hours IS NULL;
      `);
      return;
    }
    
    console.log('✅ business_hours column exists!');
    
    // Check current businesses
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('id, business_hours, name');
    
    if (error) {
      console.log('❌ Error fetching businesses:', error);
      return;
    }
    
    console.log(`📊 Found ${businesses.length} business(es)`);
    
    // Update businesses without business hours
    const businessesNeedingHours = businesses.filter(b => 
      !b.business_hours || 
      Object.keys(b.business_hours).length === 0
    );
    
    if (businessesNeedingHours.length > 0) {
      console.log(`⚙️ Setting default hours for ${businessesNeedingHours.length} business(es)...`);
      
      const defaultHours = {
        monday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
        tuesday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
        wednesday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
        thursday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
        friday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
        saturday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
        sunday: { isOpen: false, openTime: '09:00', closeTime: '17:00' }
      };
      
      for (const business of businessesNeedingHours) {
        const { error: updateError } = await supabase
          .from('businesses')
          .update({ business_hours: defaultHours })
          .eq('id', business.id);
        
        if (updateError) {
          console.log(`❌ Error updating business ${business.name}:`, updateError);
        } else {
          console.log(`✅ Updated business: ${business.name}`);
        }
      }
    } else {
      console.log('✅ All businesses already have business hours set');
      
      // Show current business hours
      businesses.forEach(b => {
        console.log(`📋 ${b.name}: ${b.business_hours ? 'Has hours configured' : 'No hours'}`);
      });
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

if (require.main === module) {
  setupBusinessHours().then(() => {
    console.log('🏁 Setup complete');
    process.exit(0);
  }).catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { setupBusinessHours };