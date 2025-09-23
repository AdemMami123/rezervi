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

    // Get business info (business_settings might not exist yet)
    const { data: business, error: businessError } = await (req.supabase || require('../supabaseClient'))
      .from('businesses')
      .select('id, name')
      .eq('id', id)
      .single();

    if (businessError || !business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Try to get business settings, but don't fail if they don't exist
    let settings = {
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

    try {
      const { data: businessSettings } = await (req.supabase || require('../supabaseClient'))
        .from('business_settings')
        .select('*')
        .eq('business_id', id)
        .single();

      if (businessSettings) {
        settings = {
          ...settings,
          ...businessSettings
        };
      }
    } catch (settingsError) {
      // Settings don't exist, use defaults
      console.log('Using default settings for business:', id);
    }

    // Get existing reservations for the date
    const { data: reservations, error: reservationsError } = await (req.supabase || require('../supabaseClient'))
      .from('reservations')
      .select('time, payment_status')
      .eq('business_id', id)
      .eq('date', date);

    if (reservationsError) {
      console.error('Error fetching reservations:', reservationsError);
      return res.status(500).json({ error: 'Failed to fetch reservations' });
    }

    // Get day of week and working hours
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const workingDay = settings.working_hours_json.find(d => d.day === dayOfWeek);

    if (!workingDay || !workingDay.enabled) {
      return res.json({ slots: [] }); // Business is closed on this day
    }

    // Generate time slots
    const slots = [];
    const slotDuration = settings.slot_duration_minutes || 30;
    
    // Parse opening and closing times
    const [openHour, openMinute] = workingDay.open.split(':').map(Number);
    const [closeHour, closeMinute] = workingDay.close.split(':').map(Number);
    
    // Create time slots
    let currentHour = openHour;
    let currentMinute = openMinute;
    
    while (currentHour < closeHour || (currentHour === closeHour && currentMinute < closeMinute)) {
      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      
      // Check if this slot is already booked
      const bookedCount = reservations.filter(r => r.time === timeString).length;
      const maxBookings = settings.max_simultaneous_bookings || 1;
      
      if (bookedCount < maxBookings) {
        slots.push({
          time: timeString,
          available: true,
          booked: bookedCount,
          max: maxBookings
        });
      }

      // Add slot duration
      currentMinute += slotDuration;
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
      }
    }

    res.json({ slots });
  } catch (error) {
    console.error('Error in getBusinessAvailability:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const createBooking = async (req, res) => {
  try {
    const { business_id, booking_date, booking_time, notes, payment_method } = req.body;

    // Validate required fields
    if (!business_id || !booking_date || !booking_time) {
      return res.status(400).json({ error: 'Missing required booking information' });
    }

    // Get user info if authenticated
    const user_id = req.user ? req.user.id : null;
    let customerInfo = {};

    if (user_id) {
      // Get user details from auth
      const { data: userData, error: userError } = await (req.supabase || require('../supabaseClient'))
        .from('users')
        .select('email, full_name, phone')
        .eq('id', user_id)
        .single();

      if (!userError && userData) {
        customerInfo = {
          name: userData.full_name || userData.email,
          email: userData.email,
          phone: userData.phone || ''
        };
      }
    }

    // If no user info, require customer details in request
    if (!customerInfo.name) {
      const { customer_name, customer_phone, customer_email } = req.body;
      if (!customer_name || !customer_phone) {
        return res.status(400).json({ error: 'Customer name and phone are required' });
      }
      customerInfo = {
        name: customer_name,
        phone: customer_phone,
        email: customer_email || ''
      };
    }

    // Check if slot is still available
    const { data: existingReservations } = await (req.supabase || require('../supabaseClient'))
      .from('reservations')
      .select('id')
      .eq('business_id', business_id)
      .eq('date', booking_date)
      .eq('time', booking_time);

    if (existingReservations && existingReservations.length > 0) {
      return res.status(400).json({ error: 'This time slot is no longer available' });
    }

    // Create reservation
    const reservationData = {
      business_id,
      date: booking_date,
      time: booking_time,
      payment_status: payment_method === 'online' ? 'paid' : 'unpaid'
    };

    // Add client_id if authenticated
    if (user_id) {
      reservationData.client_id = user_id;
    }

    const { data: reservation, error } = await (req.supabase || require('../supabaseClient'))
      .from('reservations')
      .insert(reservationData)
      .select(`
        *,
        businesses!reservations_business_id_fkey(
          id,
          name,
          type,
          location
        )
      `)
      .single();

    if (error) {
      console.error('Error creating reservation:', error);
      return res.status(500).json({ error: 'Failed to create reservation' });
    }

    // Transform response to match frontend expectations
    const transformedBooking = {
      ...reservation,
      booking_date: reservation.date,
      booking_time: reservation.time,
      business_name: reservation.businesses?.name,
      business_type: reservation.businesses?.type,
      status: 'confirmed' // Default status for frontend compatibility
    };

    // TODO: Send SMS/Email notification
    // TODO: Process online payment if applicable

    res.status(201).json({ 
      booking: transformedBooking,
      message: 'Reservation created successfully',
      confirmationCode: `RZ${reservation.id.toString().substr(-6).toUpperCase()}`
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
