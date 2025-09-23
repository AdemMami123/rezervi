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
      confirmationCode: `RZ${booking.id.substr(-6).toUpperCase()}`
    });
  } catch (error) {
    console.error('Error in createBooking:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching business details:', error);
      return res.status(404).json({ error: 'Business not found' });
    }

    // You might want to fetch business settings, reviews, etc. here
    // For now, just return basic business info
    res.json(business);
  } catch (error) {
    console.error('Error in getBusinessDetails:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getBusinessAvailability = async (req, res) => {
  try {
    const { id, date } = req.params;
    
    // This is a simplified implementation
    // In a real app, you'd check:
    // 1. Business working hours for the day
    // 2. Existing bookings
    // 3. Business-specific availability rules
    
    // For now, return some dummy available slots
    const availableSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
    ];

    res.json({ 
      business_id: id, 
      date: date || new Date().toISOString().split('T')[0],
      available_slots: availableSlots 
    });
  } catch (error) {
    console.error('Error in getBusinessAvailability:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const createBooking = async (req, res) => {
  try {
    const {
      business_id,
      date,
      time_slot,
      customer_name,
      customer_phone,
      customer_email,
      notes,
      payment_method
    } = req.body;

    const user_id = req.user.id;

    // Validate required fields
    if (!business_id || !date || !time_slot || !customer_name || !customer_phone) {
      return res.status(400).json({ 
        error: 'Missing required fields: business_id, date, time_slot, customer_name, customer_phone' 
      });
    }

    // Check if business exists
    const { data: business, error: businessError } = await req.supabase
      .from('businesses')
      .select('id, name')
      .eq('id', business_id)
      .single();

    if (businessError || !business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Create booking
    const bookingData = {
      business_id,
      user_id,
      date,
      time_slot,
      customer_name,
      customer_phone,
      customer_email: customer_email || null,
      notes: notes || null,
      payment_method,
      status: 'pending',
      payment_status: payment_method === 'online' ? 'pending' : 'cash'
    };

    const { data: booking, error: bookingError } = await req.supabase
      .from('bookings')
      .insert([bookingData])
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      return res.status(500).json({ error: 'Failed to create booking' });
    }

    // If online payment, you would integrate with payment gateway here
    if (payment_method === 'online') {
      // For now, just return a dummy payment URL
      res.json({
        booking,
        payment_url: `https://payment-gateway.com/pay/${booking.id}`,
        message: 'Booking created successfully. Redirecting to payment...'
      });
    } else {
      res.json({
        booking,
        message: 'Booking created successfully. You will receive a confirmation SMS shortly.'
      });
    }

    // Here you would typically:
    // 1. Send SMS confirmation to customer
    // 2. Send notification to business owner
    // 3. Send email confirmation if email provided

  } catch (error) {
    console.error('Error in createBooking:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getUserBookings = async (req, res) => {
  try {
    const user_id = req.user.id;

    const { data: bookings, error } = await req.supabase
      .from('bookings')
      .select(`
        *,
        businesses!bookings_business_id_fkey(name, type, location)
      `)
      .eq('user_id', user_id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching user bookings:', error);
      return res.status(500).json({ error: 'Failed to fetch bookings' });
    }

    res.json(bookings);
  } catch (error) {
    console.error('Error in getUserBookings:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user_id = req.user.id;

    // Only allow users to cancel their own bookings
    if (status !== 'cancelled') {
      return res.status(400).json({ error: 'Users can only cancel bookings' });
    }

    const { data: booking, error } = await req.supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating booking:', error);
      return res.status(500).json({ error: 'Failed to update booking' });
    }

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found or you do not have permission to modify it' });
    }

    res.json({ booking, message: 'Booking updated successfully' });
  } catch (error) {
    console.error('Error in updateBookingStatus:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getBusinesses,
  getBusinessDetails,
  getBusinessAvailability,
  createBooking,
  getUserBookings,
  updateBookingStatus
};
