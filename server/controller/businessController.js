// const supabase = require('../supabaseClient'); // Removed global supabase import

// Helper function to get business ID for the authenticated user
// This function now takes the supabase client instance as an argument
const _getBusinessIdForUser = async (supabaseClient, user_id) => {
  const { data, error } = await supabaseClient
    .from('businesses')
    .select('id')
    .eq('user_id', user_id)
    .single();

  if (error || !data) {
    throw new Error('Business not found for this user.');
  }
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
  const { payment_status } = req.body;
  const user_id = req.user.id;

  try {
    const business_id = await _getBusinessIdForUser(req.supabase, user_id); // Pass req.supabase

    // First verify the reservation belongs to the business
    const { data: reservationToUpdate, error: reservationFetchError } = await req.supabase // Use req.supabase
      .from('reservations')
      .select('id, business_id')
      .eq('id', id)
      .single();

    if (reservationFetchError || !reservationToUpdate || reservationToUpdate.business_id !== business_id) {
      return res.status(403).json({ error: 'Not authorized to update this reservation.' });
    }

    const { data, error } = await req.supabase // Use req.supabase
      .from('reservations')
      .update({ payment_status })
      .eq('id', id)
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ message: 'Reservation status updated successfully', reservation: data[0] });
  } catch (error) {
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
  const { name, type, location, latitude, longitude, phone, description } = req.body;

  try {
    // First verify that the user owns a business
    const business_id = await _getBusinessIdForUser(req.supabase, user_id);

    const { data, error } = await req.supabase
      .from('businesses')
      .update({
        name,
        type,
        location,
        latitude,
        longitude,
        phone,
        description,
        updated_at: new Date().toISOString()
      })
      .eq('id', business_id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ message: 'Business updated successfully', business: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { 
  registerBusiness,
  getBusinessReservations,
  updateReservationStatus,
  getBusinessSettings,
  updateBusinessSettings,
  getUserBusiness,
  updateBusiness
}; 