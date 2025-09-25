// const supabase = require('../supabaseClient'); // Removed global supabase import

// Helper function to get business ID for the authenticated user
// This function now takes the supabase client instance as an argument
const _getBusinessIdForUser = async (supabaseClient, user_id) => {
  console.log('_getBusinessIdForUser: Looking for business with user_id:', user_id);
  
  const { data, error } = await supabaseClient
    .from('businesses')
    .select('id')
    .eq('user_id', user_id)
    .single();

  if (error) {
    console.log('_getBusinessIdForUser: Database error:', error);
    throw new Error(`Business lookup failed: ${error.message}`);
  }
  
  if (!data) {
    console.log('_getBusinessIdForUser: No business found for user');
    throw new Error('Business not found for this user. Please register your business first.');
  }
  
  console.log('_getBusinessIdForUser: Found business ID:', data.id);
  return data.id;
};

const registerBusiness = async (req, res) => {
  const { name, type, location, latitude, longitude } = req.body;
  const user_id = req.user?.id;

  console.log('Attempting to register business for user_id:', user_id);

  if (!user_id) {
    return res.status(401).json({ error: 'User not authenticated or user ID missing.' });
  }

  try {
    const { data, error } = await req.supabase // Use req.supabase
      .from('businesses')
      .insert([{ user_id, name, type, location, latitude, longitude }])
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ message: 'Business registered successfully', business: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getBusinessReservations = async (req, res) => {
  const user_id = req.user.id;

  try {
    const business_id = await _getBusinessIdForUser(req.supabase, user_id); // Pass req.supabase

    const { data: reservations, error: reservationsError } = await req.supabase // Use req.supabase
      .from('reservations')
      .select(`
        *,
        users!reservations_client_id_fkey(
          full_name
        )
      `)
      .eq('business_id', business_id)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (reservationsError) {
      return res.status(400).json({ error: reservationsError.message });
    }

    // Transform data to include booking details with correct field names
    const transformedReservations = reservations.map(reservation => ({
      ...reservation,
      customer_name: reservation.users?.full_name || 'Unknown',
      booking_date: reservation.date,
      booking_time: reservation.time
    }));

    res.status(200).json({ reservations: transformedReservations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateReservationStatus = async (req, res) => {
  const { id } = req.params;
  const { status, payment_status } = req.body;
  const user_id = req.user.id;

  // Validate status values (now includes completed)
  const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be pending, confirmed, or cancelled.' });
  }

  try {
    const business_id = await _getBusinessIdForUser(req.supabase, user_id); // Pass req.supabase

    // First verify the reservation belongs to the business
    const { data: reservationToUpdate, error: reservationFetchError } = await req.supabase // Use req.supabase
      .from('reservations')
      .select('id, business_id, status, customer_name, date, time')
      .eq('id', id)
      .single();

    if (reservationFetchError || !reservationToUpdate || reservationToUpdate.business_id !== business_id) {
      return res.status(403).json({ error: 'Not authorized to update this reservation.' });
    }

    // Build update object dynamically based on what's provided
    const updateData = {};
  if (status) updateData.status = status;
    if (payment_status) updateData.payment_status = payment_status;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update.' });
    }

    // Update the reservation
    const { data, error } = await req.supabase // Use req.supabase
      .from('reservations')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Log the action for audit trail
    console.log(`Reservation ${id} updated by business owner ${user_id}:`, {
      previousStatus: reservationToUpdate.status,
      newStatus: status,
      customerName: reservationToUpdate.customer_name,
      date: reservationToUpdate.date,
      time: reservationToUpdate.time
    });

    res.status(200).json({ 
      message: 'Reservation status updated successfully', 
      reservation: data[0],
      action: status === 'confirmed' ? 'accepted' : status === 'cancelled' ? 'declined' : status === 'completed' ? 'completed' : 'updated'
    });
  } catch (error) {
    console.error('Error updating reservation status:', error);
    res.status(500).json({ error: error.message });
  }
};

const getBusinessSettings = async (req, res) => {
  const user_id = req.user.id;

  try {
    const business_id = await _getBusinessIdForUser(req.supabase, user_id); // Pass req.supabase

    const { data: settings, error } = await req.supabase // Use req.supabase
      .from('business_settings')
      .select('*')
      .eq('business_id', business_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(200).json({ settings: null, message: 'No settings found for this business.' });
      }
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ settings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateBusinessSettings = async (req, res) => {
  const { slot_duration_minutes, working_hours_json, online_payment_enabled, accept_walkins, max_simultaneous_bookings } = req.body;
  const user_id = req.user.id;

  try {
    const business_id = await _getBusinessIdForUser(req.supabase, user_id); // Pass req.supabase

    const { data, error } = await req.supabase // Use req.supabase
      .from('business_settings')
      .upsert(
        {
          business_id,
          slot_duration_minutes,
          working_hours_json,
          online_payment_enabled,
          accept_walkins,
          max_simultaneous_bookings,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'business_id' }
      )
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ message: 'Business settings updated successfully', settings: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUserBusiness = async (req, res) => {
  const user_id = req.user.id;

  try {
    const { data: business, error } = await req.supabase // Use req.supabase
      .from('businesses')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(200).json({ business: null, message: 'No business found for this user.' });
      }
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ business });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateBusiness = async (req, res) => {
  const user_id = req.user.id;
  const { name, type, location, latitude, longitude, phone, description, business_hours } = req.body;

  console.log('updateBusiness: Request received for user:', user_id);
  console.log('updateBusiness: Request body:', req.body);

  try {
    // First verify that the user owns a business
    console.log('updateBusiness: Getting business ID for user:', user_id);
    const business_id = await _getBusinessIdForUser(req.supabase, user_id);
    console.log('updateBusiness: Found business ID:', business_id);

    // Prepare update data - only include coordinates if they are provided
    const updateData = {
      name,
      type,
      location,
      phone,
      description,
      updated_at: new Date().toISOString()
    };

    // Only update coordinates if they are provided (preserve existing if not changed)
    if (latitude && longitude) {
      updateData.latitude = latitude;
      updateData.longitude = longitude;
      console.log('updateBusiness: Including coordinates in update');
    }

    // Handle business hours if provided
    if (business_hours) {
      updateData.business_hours = business_hours;
      console.log('updateBusiness: Including business hours in update');
    }

    console.log('updateBusiness: Update data:', updateData);

    const { data, error } = await req.supabase
      .from('businesses')
      .update(updateData)
      .eq('id', business_id)
      .select()
      .single();

    if (error) {
      console.log('updateBusiness: Supabase error:', error);
      return res.status(400).json({ error: error.message });
    }

    console.log('updateBusiness: Success, updated business:', data);
    res.status(200).json({ message: 'Business updated successfully', business: data });
  } catch (error) {
    console.log('updateBusiness: Caught exception:', error);
    res.status(500).json({ error: error.message });
  }
};

// Helper function to accept a reservation
const acceptReservation = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  try {
    const business_id = await _getBusinessIdForUser(req.supabase, user_id);

    // Get the reservation details first
    const { data: reservation, error: fetchError } = await req.supabase
      .from('reservations')
      .select('*, users!reservations_client_id_fkey(full_name, email)')
      .eq('id', id)
      .eq('business_id', business_id)
      .single();

    if (fetchError || !reservation) {
      return res.status(404).json({ error: 'Reservation not found or access denied.' });
    }

    if (reservation.status === 'confirmed') {
      return res.status(400).json({ error: 'Reservation is already confirmed.' });
    }

    // Update status to confirmed
    const { data, error } = await req.supabase
      .from('reservations')
      .update({ status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    console.log(`Reservation ${id} ACCEPTED by business owner ${user_id} for customer: ${reservation.users?.full_name}`);

    res.status(200).json({ 
      message: 'Reservation accepted successfully', 
      reservation: data[0],
      customer: reservation.users
    });
  } catch (error) {
    console.error('Error accepting reservation:', error);
    res.status(500).json({ error: error.message });
  }
};

// Helper function to decline a reservation
const declineReservation = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body; // Optional decline reason
  const user_id = req.user.id;

  try {
    const business_id = await _getBusinessIdForUser(req.supabase, user_id);

    // Get the reservation details first
    const { data: reservation, error: fetchError } = await req.supabase
      .from('reservations')
      .select('*, users!reservations_client_id_fkey(full_name, email)')
      .eq('id', id)
      .eq('business_id', business_id)
      .single();

    if (fetchError || !reservation) {
      return res.status(404).json({ error: 'Reservation not found or access denied.' });
    }

    if (reservation.status === 'cancelled') {
      return res.status(400).json({ error: 'Reservation is already cancelled.' });
    }

    // Update status to cancelled with optional reason
    const updateData = { 
      status: 'cancelled', 
      updated_at: new Date().toISOString()
    };
    if (reason) {
      updateData.decline_reason = reason;
    }

    const { data, error } = await req.supabase
      .from('reservations')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    console.log(`Reservation ${id} DECLINED by business owner ${user_id} for customer: ${reservation.users?.full_name}${reason ? ` (Reason: ${reason})` : ''}`);

    res.status(200).json({ 
      message: 'Reservation declined successfully', 
      reservation: data[0],
      customer: reservation.users
    });
  } catch (error) {
    console.error('Error declining reservation:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get reservation statistics for business dashboard
const getReservationStats = async (req, res) => {
  const user_id = req.user.id;

  try {
    const business_id = await _getBusinessIdForUser(req.supabase, user_id);

    // Get all reservations for stats calculation
    const { data: reservations, error } = await req.supabase
      .from('reservations')
      .select('status, date, created_at')
      .eq('business_id', business_id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const stats = {
      total: reservations.length,
      pending: reservations.filter(r => r.status === 'pending').length,
      confirmed: reservations.filter(r => r.status === 'confirmed').length,
      cancelled: reservations.filter(r => r.status === 'cancelled').length,
      today: reservations.filter(r => r.date === today).length,
      thisMonth: reservations.filter(r => r.date && r.date.startsWith(thisMonth)).length,
      recentPending: reservations.filter(r => r.status === 'pending').slice(0, 5)
    };

    res.status(200).json({ stats });
  } catch (error) {
    console.error('Error getting reservation stats:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { 
  registerBusiness,
  getBusinessReservations,
  updateReservationStatus,
  acceptReservation,
  declineReservation,
  getReservationStats,
  getBusinessSettings,
  updateBusinessSettings,
  getUserBusiness,
  updateBusiness
}; 