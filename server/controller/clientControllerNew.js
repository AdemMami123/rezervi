// Controller for client-facing features (business discovery, booking, etc.)

const getBusinesses = async (req, res) => {
  try {
    const { type, lat, lng, radius = 10 } = req.query;
    
    let query = (req.supabase || require('../supabaseClient'))
      .from('businesses')
      .select(`
        id,
        name,
        type,
        location,
        latitude,
        longitude,
        created_at,
        user_id,
        users!businesses_user_id_fkey(full_name)
      `);

    // Filter by type if provided
    if (type) {
      query = query.eq('type', type);
    }

    // If location is provided, we could add distance filtering here
    // For now, just get all businesses
    const { data: businesses, error } = await query;

    if (error) {
      console.error('Error fetching businesses:', error);
      return res.status(500).json({ error: 'Failed to fetch businesses' });
    }

    // Fetch primary photos for all businesses
    if (businesses && businesses.length > 0) {
      const businessIds = businesses.map(b => b.id);
      const { data: photos, error: photosError } = await (req.supabase || require('../supabaseClient'))
        .from('business_photos')
        .select('business_id, photo_url')
        .in('business_id', businessIds)
        .eq('is_primary', true);

      if (!photosError && photos) {
        // Add primary photo to each business
        businesses.forEach(business => {
          const primaryPhoto = photos.find(p => p.business_id === business.id);
          business.primary_photo = primaryPhoto?.photo_url || null;
        });
      }
    }

    res.json(businesses);
  } catch (error) {
    console.error('Error in getBusinesses:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getBusinessDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: business, error } = await (req.supabase || require('../supabaseClient'))
      .from('businesses')
      .select(`
        *,
        users!businesses_user_id_fkey(full_name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching business details:', error);
      return res.status(404).json({ error: 'Business not found' });
    }

    // Fetch business photos
    const { data: photos, error: photosError } = await (req.supabase || require('../supabaseClient'))
      .from('business_photos')
      .select('*')
      .eq('business_id', id)
      .order('display_order');

    if (photosError) {
      console.error('Error fetching business photos:', photosError);
      // Continue without photos if there's an error
    }

    // Add photos to business object
    business.photos = photos || [];

    res.json({ business });
  } catch (error) {
    console.error('Error in getBusinessDetails:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getBusinessAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required' });
    }

    // Get business settings for working hours and slot duration
    const { data: business, error: businessError } = await (req.supabase || require('../supabaseClient'))
      .from('businesses')
      .select(`
        id,
        name,
        business_settings(
          slot_duration_minutes,
          working_hours_json,
          max_simultaneous_bookings
        )
      `)
      .eq('id', id)
      .single();

    if (businessError || !business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Get existing bookings for the date
    const { data: bookings, error: bookingsError } = await (req.supabase || require('../supabaseClient'))
      .from('bookings')
      .select('time, status')
      .eq('business_id', id)
      .eq('date', date)
      .neq('status', 'cancelled');

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return res.status(500).json({ error: 'Failed to fetch bookings' });
    }

    // Generate available time slots
    const settings = business.business_settings?.[0] || {
      slot_duration_minutes: 30,
      working_hours_json: [
        { day: 'monday', enabled: true, open: '09:00', close: '17:00' },
        { day: 'tuesday', enabled: true, open: '09:00', close: '17:00' },
        { day: 'wednesday', enabled: true, open: '09:00', close: '17:00' },
        { day: 'thursday', enabled: true, open: '09:00', close: '17:00' },
        { day: 'friday', enabled: true, open: '09:00', close: '17:00' },
        { day: 'saturday', enabled: true, open: '09:00', close: '17:00' },
        { day: 'sunday', enabled: false, open: '09:00', close: '17:00' }
      ],
      max_simultaneous_bookings: 1
    };

    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'lowercase' });
    const workingDay = settings.working_hours_json.find(d => d.day === dayOfWeek);

    if (!workingDay || !workingDay.enabled) {
      return res.json({ slots: [] });
    }

    // Generate time slots
    const slots = [];
    const startTime = new Date(`${date}T${workingDay.open}:00`);
    const endTime = new Date(`${date}T${workingDay.close}:00`);
    const slotDuration = settings.slot_duration_minutes || 30;

    let currentTime = new Date(startTime);
    while (currentTime < endTime) {
      const timeString = currentTime.toTimeString().substr(0, 5);
      
      // Check if this slot is already booked
      const bookedCount = bookings.filter(b => b.time === timeString).length;
      const maxBookings = settings.max_simultaneous_bookings || 1;
      
      if (bookedCount < maxBookings) {
        slots.push({
          time: timeString,
          available: true,
          booked: bookedCount,
          max: maxBookings
        });
      }

      currentTime.setMinutes(currentTime.getMinutes() + slotDuration);
    }

    res.json({ slots });
  } catch (error) {
    console.error('Error in getBusinessAvailability:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const createBooking = async (req, res) => {
  try {
    const { businessId, date, time, customerInfo, paymentMethod, amount, paymentDetails } = req.body;

    // Validate required fields
    if (!businessId || !date || !time || !customerInfo?.name || !customerInfo?.phone) {
      return res.status(400).json({ error: 'Missing required booking information' });
    }

    // Check if slot is still available
    const { data: existingBookings } = await (req.supabase || require('../supabaseClient'))
      .from('bookings')
      .select('id')
      .eq('business_id', businessId)
      .eq('date', date)
      .eq('time', time)
      .neq('status', 'cancelled');

    if (existingBookings && existingBookings.length > 0) {
      return res.status(400).json({ error: 'This time slot is no longer available' });
    }

    // Create booking
    const { data: booking, error } = await (req.supabase || require('../supabaseClient'))
      .from('bookings')
      .insert({
        business_id: businessId,
        date,
        time,
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        customer_email: customerInfo.email || '',
        notes: customerInfo.notes || '',
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'online' ? 'paid' : 'pending',
        amount: amount || 0,
        status: 'confirmed'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating booking:', error);
      return res.status(500).json({ error: 'Failed to create booking' });
    }

    // TODO: Send SMS/Email notification
    // TODO: Process online payment if applicable

    res.status(201).json({ 
      booking,
      message: 'Booking created successfully',
      confirmationCode: `RZ${booking.id.toString().substr(-6).toUpperCase()}`
    });
  } catch (error) {
    console.error('Error in createBooking:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getBusinesses,
  getBusinessDetails,
  getBusinessAvailability,
  createBooking
};
