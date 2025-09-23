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
      status: 'confirmed' // Default status since your schema doesn't have a status field
    }));

    res.json({ bookings: transformedBookings });
  } catch (error) {
    console.error('Error in getUserBookings:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateUserBooking = async (req, res) => {
  const { id } = req.params;
  const { payment_status } = req.body; // Changed from status to payment_status to match schema
  const user_id = req.user.id;

  try {
    // First verify the reservation belongs to the user
    const { data: reservation, error: fetchError } = await req.supabase
      .from('reservations')
      .select('client_id')
      .eq('id', id)
      .single();

    if (fetchError || !reservation || reservation.client_id !== user_id) {
      return res.status(403).json({ error: 'Not authorized to update this reservation' });
    }

    // Update the reservation
    const { data, error } = await req.supabase
      .from('reservations')
      .update({ 
        payment_status
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating reservation:', error);
      return res.status(500).json({ error: 'Failed to update reservation' });
    }

    res.json({ 
      message: 'Reservation updated successfully',
      booking: data[0] // Keep 'booking' for frontend compatibility
    });
  } catch (error) {
    console.error('Error in updateUserBooking:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getUserBookings,
  updateUserBooking
};
