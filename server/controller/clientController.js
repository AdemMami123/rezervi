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
        phone,
        description,
        instagram_url,
        facebook_url,
        business_hours,
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

    // Fetch primary photos and reviews for all businesses
    if (businesses && businesses.length > 0) {
      const businessIds = businesses.map(b => b.id);
      
      // Fetch primary photos
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

      // Fetch reviews and calculate ratings
      const { data: reviews, error: reviewsError } = await (req.supabase || require('../supabaseClient'))
        .from('reviews')
        .select('business_id, rating')
        .in('business_id', businessIds);

      if (!reviewsError && reviews) {
        // Group reviews by business and calculate averages
        const reviewsByBusiness = reviews.reduce((acc, review) => {
          if (!acc[review.business_id]) {
            acc[review.business_id] = [];
          }
          acc[review.business_id].push(review.rating);
          return acc;
        }, {});

        // Add rating information to each business
        businesses.forEach(business => {
          const businessReviews = reviewsByBusiness[business.id] || [];
          const totalReviews = businessReviews.length;
          const averageRating = totalReviews > 0 
            ? businessReviews.reduce((sum, rating) => sum + rating, 0) / totalReviews 
            : 0;

          business.rating = {
            averageRating: Math.round(averageRating * 10) / 10,
            totalReviews
          };
        });
      } else {
        // Add default rating info if reviews fetch fails
        businesses.forEach(business => {
          business.rating = {
            averageRating: 0,
            totalReviews: 0
          };
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
    console.log(`[getBusinessDetails] Fetching photos for business ID: ${id}`);
    const { data: photos, error: photosError } = await (req.supabase || require('../supabaseClient'))
      .from('business_photos')
      .select('*')
      .eq('business_id', id)
      .order('display_order');

    if (photosError) {
      console.error('[getBusinessDetails] Error fetching business photos:', photosError);
      // Continue without photos if there's an error
    }

    console.log(`[getBusinessDetails] Found ${photos?.length || 0} photos for business ${id}`);
    console.log('[getBusinessDetails] Photos:', JSON.stringify(photos, null, 2));

    // Add photos to business object
    business.photos = photos || [];

    console.log(`[getBusinessDetails] Returning business with ${business.photos.length} photos`);
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
    
    console.log(`Fetching availability for business ${id} on date ${date}`);
    
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
      console.error('Business not found:', businessError);
      return res.status(404).json({ error: 'Business not found' });
    }

    // Default settings with all weekdays enabled
    let settings = {
      slot_duration_minutes: 30,
      working_hours_json: [
        { day: 'monday', enabled: true, open: '09:00', close: '17:00' },
        { day: 'tuesday', enabled: true, open: '09:00', close: '17:00' },
        { day: 'wednesday', enabled: true, open: '09:00', close: '17:00' },
        { day: 'thursday', enabled: true, open: '09:00', close: '17:00' },
        { day: 'friday', enabled: true, open: '09:00', close: '17:00' },
        { day: 'saturday', enabled: true, open: '09:00', close: '17:00' },
        { day: 'sunday', enabled: true, open: '09:00', close: '17:00' } // Enable Sunday too for testing
      ],
      max_simultaneous_bookings: 1
    };

    // Try to get business settings, merge with defaults if found
    try {
      const { data: businessSettings, error: settingsError } = await (req.supabase || require('../supabaseClient'))
        .from('business_settings')
        .select('*')
        .eq('business_id', id)
        .single();

      if (businessSettings && !settingsError) {
        console.log('Found business settings:', businessSettings);
        settings = {
          ...settings,
          ...businessSettings,
          // Ensure working_hours_json is parsed if it's a string
          working_hours_json: typeof businessSettings.working_hours_json === 'string' 
            ? JSON.parse(businessSettings.working_hours_json) 
            : businessSettings.working_hours_json || settings.working_hours_json
        };
      }
    } catch (settingsError) {
      console.log('No business settings found, using defaults for business:', id);
    }

    console.log('Using settings:', settings);

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

    console.log(`Found ${reservations?.length || 0} existing reservations for ${date}`);

    // Get day of week and working hours
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    console.log(`Day of week: ${dayOfWeek}`);
    
    const workingDay = settings.working_hours_json.find(d => d.day === dayOfWeek);
    console.log('Working day config:', workingDay);

    if (!workingDay || !workingDay.enabled) {
      console.log('Business is closed on this day');
      return res.json({ slots: [] }); // Business is closed on this day
    }

    // Generate time slots
    const slots = [];
    const slotDuration = settings.slot_duration_minutes || 30;
    
    console.log(`Generating slots with ${slotDuration} minute duration from ${workingDay.open} to ${workingDay.close}`);
    
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

    console.log(`Generated ${slots.length} available slots`);
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
      payment_status: payment_method === 'online' ? 'paid' : 'unpaid',
      status: 'pending',
      customer_name: customerInfo.name,
      customer_phone: customerInfo.phone || '',
      customer_email: customerInfo.email || ''
    };

    // Add client_id if authenticated
    if (user_id) {
      reservationData.client_id = user_id;
    }

    // Add notes if provided
    if (notes) {
      reservationData.notes = notes;
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
      customer_name: reservation.customer_name,
      status: reservation.status // Use actual status from database
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

// Get business photos (public endpoint)
const getBusinessPhotosPublic = async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = req.supabase || require('../supabaseClient');
    
    console.log(`[getBusinessPhotosPublic] Fetching photos for business ID: ${id}`);
    console.log(`[getBusinessPhotosPublic] Full URL: ${req.originalUrl}`);
    console.log(`[getBusinessPhotosPublic] Params:`, req.params);
    
    const { data: photos, error } = await supabase
      .from('business_photos')
      .select('*')
      .eq('business_id', id)
      .order('display_order');

    if (error) {
      console.error('[getBusinessPhotosPublic] Supabase error:', error);
      return res.status(400).json({ error: error.message });
    }

    console.log(`[getBusinessPhotosPublic] Found ${photos?.length || 0} photos`);
    if (photos && photos.length > 0) {
      console.log('[getBusinessPhotosPublic] First photo:', photos[0]);
    }

    res.status(200).json({ photos: photos || [] });
  } catch (error) {
    console.error('[getBusinessPhotosPublic] Server error:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
};

module.exports = {
  getBusinesses,
  getBusinessDetails,
  getBusinessAvailability,
  createBooking,
  getBusinessPhotosPublic
};
