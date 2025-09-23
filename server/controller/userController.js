const getUserBookings = async (req, res) => {
  const user_id = req.user.id;

  try {
    const { data: reservations, error } = await req.supabase
      .from('reservations')
      .select(`
        *,
        businesses!reservations_business_id_fkey(
          id,
          name,
          type,
          location
        )
      `)
      .eq('client_id', user_id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching user reservations:', error);
      return res.status(500).json({ error: 'Failed to fetch reservations' });
    }

    // Transform the data to match frontend expectations
    const transformedBookings = reservations.map(reservation => ({
      ...reservation,
      booking_date: reservation.date,
      booking_time: reservation.time,
      business_name: reservation.businesses?.name,
      business_type: reservation.businesses?.type,
      // Use the actual status from the database, fallback to 'confirmed' if not set
      status: reservation.status || 'confirmed'
    }));

    res.json({ bookings: transformedBookings });
  } catch (error) {
    console.error('Error in getUserBookings:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateUserBooking = async (req, res) => {
  const { id } = req.params;
  const { action, date, time, reason } = req.body;
  const user_id = req.user.id;

  try {
    // First verify the reservation belongs to the user
    const { data: reservation, error: fetchError } = await req.supabase
      .from('reservations')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !reservation || reservation.client_id !== user_id) {
      return res.status(403).json({ error: 'Not authorized to update this reservation' });
    }

    let updateData = {};
    let message = '';

    switch (action) {
      case 'reschedule':
        if (!date || !time) {
          return res.status(400).json({ error: 'Date and time are required for rescheduling' });
        }
        
        // Check if new slot is available
        const { data: conflictingReservation } = await req.supabase
          .from('reservations')
          .select('id')
          .eq('business_id', reservation.business_id)
          .eq('date', date)
          .eq('time', time)
          .neq('id', id)
          .single();

        if (conflictingReservation) {
          return res.status(400).json({ error: 'The selected time slot is not available' });
        }

        updateData = { 
          date,
          time,
          updated_at: new Date().toISOString()
        };
        message = 'Booking rescheduled successfully';
        break;

      case 'cancel':
        updateData = { 
          status: 'cancelled',
          notes: reason ? `${reservation.notes ? reservation.notes + '. ' : ''}Cancelled: ${reason}` : reservation.notes,
          updated_at: new Date().toISOString()
        };
        message = 'Booking cancelled successfully';
        break;

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    // Update the reservation
    const { data, error } = await req.supabase
      .from('reservations')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        businesses!reservations_business_id_fkey(
          id,
          name,
          type,
          location
        )
      `);

    if (error) {
      console.error('Error updating reservation:', error);
      return res.status(500).json({ error: 'Failed to update reservation' });
    }

    // Transform the data to match frontend expectations
    const transformedBooking = {
      ...data[0],
      booking_date: data[0].date,
      booking_time: data[0].time,
      business_name: data[0].businesses?.name,
      business_type: data[0].businesses?.type,
    };

    res.json({ 
      message,
      booking: transformedBooking
    });
  } catch (error) {
    console.error('Error in updateUserBooking:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getBookingDetails = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  console.log('Getting booking details for ID:', id, 'User ID:', user_id);

  try {
    const { data: reservation, error } = await req.supabase
      .from('reservations')
      .select(`
        *,
        businesses!reservations_business_id_fkey(
          id,
          name,
          type,
          location,
          phone,
          description
        )
      `)
      .eq('id', id)
      .eq('client_id', user_id)
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (!reservation) {
      console.log('No reservation found');
      return res.status(404).json({ error: 'Booking not found' });
    }

    console.log('Found reservation:', reservation);

    // Transform the data to match frontend expectations
    const transformedBooking = {
      ...reservation,
      booking_date: reservation.date,
      booking_time: reservation.time,
      business_name: reservation.businesses?.name,
      business_type: reservation.businesses?.type,
      business_location: reservation.businesses?.location,
      business_phone: reservation.businesses?.phone,
      business_description: reservation.businesses?.description,
    };

    res.json({ booking: transformedBooking });
  } catch (error) {
    console.error('Error in getBookingDetails:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getUserBookings,
  updateUserBooking,
  getBookingDetails
};
