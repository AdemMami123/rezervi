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
  const { name, type, location, latitude, longitude, instagram_url, facebook_url } = req.body;
  const user_id = req.user?.id;

  console.log('Attempting to register business for user_id:', user_id);
  console.log('Business data:', { name, type, location, latitude, longitude, instagram_url, facebook_url });

  if (!user_id) {
    return res.status(401).json({ error: 'User not authenticated or user ID missing.' });
  }

  // Validate required fields
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Business name is required.' });
  }

  if (!type || type.trim() === '') {
    return res.status(400).json({ error: 'Business type is required. Please select a valid business type.' });
  }

  if (!location || location.trim() === '') {
    return res.status(400).json({ error: 'Location is required.' });
  }

  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Location coordinates are required. Please select a location on the map.' });
  }

  // Validate business type against allowed values
  const allowedTypes = [
    'barbershop', 'beauty_salon', 'restaurant', 'cafe', 'football_field',
    'tennis_court', 'gym', 'car_wash', 'spa', 'dentist', 'doctor', 'other'
  ];

  if (!allowedTypes.includes(type)) {
    return res.status(400).json({ 
      error: `Invalid business type: "${type}". Please select a valid business type.`,
      allowedTypes
    });
  }

  try {
    // Create the business first with social media fields
    const businessData = { 
      user_id, 
      name, 
      type, 
      location, 
      latitude, 
      longitude 
    };

    // Add social media URLs if provided
    if (instagram_url && instagram_url.trim()) {
      businessData.instagram_url = instagram_url.trim();
    }
    if (facebook_url && facebook_url.trim()) {
      businessData.facebook_url = facebook_url.trim();
    }

    const { data, error } = await req.supabase // Use req.supabase
      .from('businesses')
      .insert([businessData])
      .select();

    if (error) {
      console.error('Database error during business registration:', error);
      return res.status(400).json({ 
        error: error.message,
        details: error.details || 'Database constraint violation'
      });
    }

    const business = data[0];

    // Handle photo uploads if any files were provided
    let uploadedPhotos = [];
    if (req.files && req.files.length > 0) {
      try {
        const maxPhotos = 10;
        const filesToProcess = req.files.slice(0, maxPhotos); // Limit to max photos
        
        for (let i = 0; i < filesToProcess.length; i++) {
          const file = filesToProcess[i];
          const fileExt = file.originalname.split('.').pop();
          const fileName = `business-${business.id}-${Date.now()}-${i}.${fileExt}`;
          const filePath = `${fileName}`;

          // Upload to Supabase Storage using the 'business-images' bucket
          const { data: uploadData, error: uploadError } = await req.supabase.storage
            .from('business-images')
            .upload(filePath, file.buffer, {
              contentType: file.mimetype,
              cacheControl: '3600'
            });

          if (uploadError) {
            console.error('Upload error for file:', fileName, uploadError);
            continue; // Skip this file but continue with others
          }

          // Get the public URL
          const { data: publicUrlData } = req.supabase.storage
            .from('business-images')
            .getPublicUrl(filePath);

          const publicUrl = publicUrlData.publicUrl;

          // Save photo record to database
          const { data: photoData, error: photoError } = await req.supabase
            .from('business_photos')
            .insert({
              business_id: business.id,
              photo_url: publicUrl,
              display_order: i,
              is_primary: i === 0 // First photo becomes primary
            })
            .select();

          if (photoError) {
            console.error('Database error for photo:', publicUrl, photoError);
            // Try to delete the uploaded file if database insert failed
            await req.supabase.storage.from('business-images').remove([filePath]);
            continue;
          }

          uploadedPhotos.push(photoData[0]);
        }
      } catch (photoError) {
        console.error('Error processing photos during business registration:', photoError);
        // Don't fail the business registration if photo upload fails
      }
    }

    res.status(201).json({ 
      message: 'Business registered successfully', 
      business: business,
      photos: uploadedPhotos,
      photoCount: uploadedPhotos.length
    });
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
          username,
          email
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
      customer_name: reservation.customer_name || reservation.users?.username || reservation.users?.email || 'Unknown',
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

    // Fetch business photos
    const { data: photos, error: photosError } = await req.supabase
      .from('business_photos')
      .select('*')
      .eq('business_id', business.id)
      .order('display_order');

    if (photosError) {
      console.error('Error fetching business photos:', photosError);
      // Continue without photos if there's an error
    }

    // Add photos to business object
    business.photos = photos || [];

    res.status(200).json({ business });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateBusiness = async (req, res) => {
  const user_id = req.user.id;
  const { name, type, location, latitude, longitude, phone, description, business_hours, instagram_url, facebook_url } = req.body;

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

    // Add social media URLs if provided
    if (instagram_url !== undefined) {
      updateData.instagram_url = instagram_url && instagram_url.trim() ? instagram_url.trim() : null;
    }
    if (facebook_url !== undefined) {
      updateData.facebook_url = facebook_url && facebook_url.trim() ? facebook_url.trim() : null;
    }

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

  console.log(`Accept reservation request - Reservation ID: ${id}, User ID: ${user_id}`);

  try {
    const business_id = await _getBusinessIdForUser(req.supabase, user_id);
    console.log(`Business ID found: ${business_id}`);

    // First verify the reservation belongs to the business and get details
    const { data: reservation, error: fetchError } = await req.supabase
      .from('reservations')
      .select('*, users!reservations_client_id_fkey(username)')
      .eq('id', id)
      .eq('business_id', business_id)
      .single();

    console.log('Reservation fetch result:', { reservation, fetchError });

    if (fetchError) {
      console.error('Reservation fetch error:', fetchError);
      return res.status(404).json({ error: `Reservation not found or access denied. Details: ${fetchError.message}` });
    }

    if (!reservation) {
      console.error('No reservation found with provided criteria');
      return res.status(404).json({ error: 'Reservation not found or access denied.' });
    }

    if (reservation.status === 'confirmed') {
      return res.status(400).json({ error: 'Reservation is already confirmed.' });
    }

    // Update status to confirmed with additional verification
    const { data, error } = await req.supabase
      .from('reservations')
      .update({ 
        status: 'confirmed'
      })
      .eq('id', id)
      .eq('business_id', business_id) // Double check business ownership
      .select();

    if (error) {
      console.error('Reservation update error:', error);
      return res.status(400).json({ error: `Failed to update reservation: ${error.message}` });
    }

    if (!data || data.length === 0) {
      console.error('No reservation was updated - possible permission issue');
      return res.status(403).json({ error: 'Unable to update reservation - permission denied' });
    }

    console.log(`Reservation ${id} ACCEPTED by business owner ${user_id} for customer: ${reservation.users?.username}`);

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

  console.log(`Decline reservation request - Reservation ID: ${id}, User ID: ${user_id}`);

  try {
    const business_id = await _getBusinessIdForUser(req.supabase, user_id);
    console.log(`Business ID found: ${business_id}`);

    // First verify the reservation belongs to the business and get details
    const { data: reservation, error: fetchError } = await req.supabase
      .from('reservations')
      .select('*, users!reservations_client_id_fkey(username)')
      .eq('id', id)
      .eq('business_id', business_id)
      .single();

    console.log('Reservation fetch result:', { reservation, fetchError });

    if (fetchError) {
      console.error('Reservation fetch error:', fetchError);
      return res.status(404).json({ error: `Reservation not found or access denied. Details: ${fetchError.message}` });
    }

    if (!reservation) {
      console.error('No reservation found with provided criteria');
      return res.status(404).json({ error: 'Reservation not found or access denied.' });
    }

    if (reservation.status === 'cancelled') {
      return res.status(400).json({ error: 'Reservation is already cancelled.' });
    }

    // Update status to cancelled with optional reason
    const updateData = { 
      status: 'cancelled'
    };
    if (reason) {
      updateData.decline_reason = reason;
    }

    const { data, error } = await req.supabase
      .from('reservations')
      .update(updateData)
      .eq('id', id)
      .eq('business_id', business_id) // Double check business ownership
      .select();

    if (error) {
      console.error('Reservation update error:', error);
      return res.status(400).json({ error: `Failed to update reservation: ${error.message}` });
    }

    if (!data || data.length === 0) {
      console.error('No reservation was updated - possible permission issue');
      return res.status(403).json({ error: 'Unable to update reservation - permission denied' });
    }

    console.log(`Reservation ${id} DECLINED by business owner ${user_id} for customer: ${reservation.users?.username}${reason ? ` (Reason: ${reason})` : ''}`);

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

// Get weekly reservation stats for notification
const getWeeklyReservationStats = async (req, res) => {
  const user_id = req.user.id;

  try {
    const business_id = await _getBusinessIdForUser(req.supabase, user_id);

    // Calculate the start (Monday) and end (Sunday) of the current week
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1; // If Sunday, go back 6 days
    
    // Start of week (Monday at 00:00:00)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - daysToMonday);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // End of week (Sunday at 23:59:59)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const startDate = startOfWeek.toISOString().split('T')[0];
    const endDate = endOfWeek.toISOString().split('T')[0];

    // Get all reservations for the current week
    const { data: weeklyReservations, error } = await req.supabase
      .from('reservations')
      .select('id, status, created_at')
      .eq('business_id', business_id)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Calculate new reservations (created this week)
    const newReservations = weeklyReservations.filter(r => {
      const createdAt = new Date(r.created_at);
      return createdAt >= startOfWeek && createdAt <= endOfWeek;
    }).length;

    // Calculate cancellations this week
    const cancellations = weeklyReservations.filter(r => r.status === 'cancelled').length;

    res.status(200).json({ 
      stats: {
        newReservations,
        cancellations,
        startDate,
        endDate
      }
    });
  } catch (error) {
    console.error('Error getting weekly reservation stats:', error);
    res.status(500).json({ error: error.message });
  }
};

// Upload business photos
const uploadBusinessPhotos = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(400).json({ message: 'User information not available.' });
  }

  const userId = req.user.id;
  
  try {
    // Get business ID for the user
    const business_id = await _getBusinessIdForUser(req.supabase, userId);
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedPhotos = [];
    
    // Check current photo count
    const { data: existingPhotos, error: countError } = await req.supabase
      .from('business_photos')
      .select('id')
      .eq('business_id', business_id);
    
    if (countError) {
      return res.status(400).json({ error: 'Error checking existing photos' });
    }
    
    const currentPhotoCount = existingPhotos.length;
    const maxPhotos = 10; // Limit to 10 photos per business
    
    if (currentPhotoCount + req.files.length > maxPhotos) {
      return res.status(400).json({ 
        error: `Cannot upload ${req.files.length} photos. Maximum ${maxPhotos} photos allowed per business. Current count: ${currentPhotoCount}` 
      });
    }

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const fileExt = file.originalname.split('.').pop();
      const fileName = `business-${business_id}-${Date.now()}-${i}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage using the 'business-images' bucket
      const { data: uploadData, error: uploadError } = await req.supabase.storage
        .from('business-images')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600'
        });

      if (uploadError) {
        console.error('Upload error for file:', fileName, uploadError);
        continue; // Skip this file but continue with others
      }

      // Get the public URL
      const { data: publicUrlData } = req.supabase.storage
        .from('business-images')
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

      // Save photo record to database
      const { data: photoData, error: photoError } = await req.supabase
        .from('business_photos')
        .insert({
          business_id,
          photo_url: publicUrl,
          display_order: currentPhotoCount + i,
          is_primary: currentPhotoCount === 0 && i === 0 // First photo of first business becomes primary
        })
        .select();

      if (photoError) {
        console.error('Database error for photo:', publicUrl, photoError);
        // Try to delete the uploaded file if database insert failed
        await req.supabase.storage.from('business-images').remove([filePath]);
        continue;
      }

      uploadedPhotos.push(photoData[0]);
    }

    if (uploadedPhotos.length === 0) {
      return res.status(400).json({ error: 'No photos were successfully uploaded' });
    }

    res.status(200).json({
      message: `${uploadedPhotos.length} photo(s) uploaded successfully`,
      photos: uploadedPhotos
    });
  } catch (error) {
    console.error('Exception in uploadBusinessPhotos:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get business photos
const getBusinessPhotos = async (req, res) => {
  try {
    const { business_id } = req.params;
    
    const { data: photos, error } = await (req.supabase || require('../supabaseClient'))
      .from('business_photos')
      .select('*')
      .eq('business_id', business_id)
      .order('display_order');

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ photos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete business photo
const deleteBusinessPhoto = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(400).json({ message: 'User information not available.' });
  }

  const userId = req.user.id;
  const { photo_id } = req.params;
  
  try {
    // Get business ID for the user
    const business_id = await _getBusinessIdForUser(req.supabase, userId);
    
    // Get the photo record to verify ownership and get the URL
    const { data: photoData, error: fetchError } = await req.supabase
      .from('business_photos')
      .select('*')
      .eq('id', photo_id)
      .eq('business_id', business_id)
      .single();
    
    if (fetchError || !photoData) {
      return res.status(404).json({ error: 'Photo not found or you do not have permission to delete it' });
    }
    
    // Extract filename from URL for storage deletion
    const urlParts = photoData.photo_url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    
    // Delete from storage
    const { error: storageError } = await req.supabase.storage
      .from('business-images')
      .remove([fileName]);
    
    if (storageError) {
      console.error('Storage deletion error:', storageError);
      // Continue with database deletion even if storage deletion fails
    }
    
    // Delete from database
    const { error: deleteError } = await req.supabase
      .from('business_photos')
      .delete()
      .eq('id', photo_id)
      .eq('business_id', business_id);
    
    if (deleteError) {
      return res.status(400).json({ error: deleteError.message });
    }
    
    res.status(200).json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Exception in deleteBusinessPhoto:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update photo order/primary status
const updateBusinessPhoto = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(400).json({ message: 'User information not available.' });
  }

  const userId = req.user.id;
  const { photo_id } = req.params;
  const { is_primary, display_order } = req.body;
  
  try {
    // Get business ID for the user
    const business_id = await _getBusinessIdForUser(req.supabase, userId);
    
    // Verify photo ownership
    const { data: photoData, error: fetchError } = await req.supabase
      .from('business_photos')
      .select('id')
      .eq('id', photo_id)
      .eq('business_id', business_id)
      .single();
    
    if (fetchError || !photoData) {
      return res.status(404).json({ error: 'Photo not found or you do not have permission to update it' });
    }
    
    const updateData = {};
    if (typeof is_primary === 'boolean') {
      updateData.is_primary = is_primary;
    }
    if (typeof display_order === 'number') {
      updateData.display_order = display_order;
    }
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid update data provided' });
    }
    
    // Update the photo
    const { data, error } = await req.supabase
      .from('business_photos')
      .update(updateData)
      .eq('id', photo_id)
      .eq('business_id', business_id)
      .select();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(200).json({
      message: 'Photo updated successfully',
      photo: data[0]
    });
  } catch (error) {
    console.error('Exception in updateBusinessPhoto:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete business and all associated data
const deleteBusiness = async (req, res) => {
  const user_id = req.user?.id;

  if (!user_id) {
    return res.status(401).json({ error: 'User not authenticated.' });
  }

  try {
    // First, get the business ID for this user
    const { data: business, error: businessError } = await req.supabase
      .from('businesses')
      .select('id')
      .eq('user_id', user_id)
      .single();

    if (businessError) {
      if (businessError.code === 'PGRST116') {
        return res.status(404).json({ error: 'No business found for this user.' });
      }
      return res.status(400).json({ error: businessError.message });
    }

    const business_id = business.id;

    // Get all business photos to delete from storage
    const { data: photos } = await req.supabase
      .from('business_photos')
      .select('photo_url')
      .eq('business_id', business_id);

    // Delete photos from storage
    if (photos && photos.length > 0) {
      for (const photo of photos) {
        try {
          const fileName = photo.photo_url.split('/').pop();
          await req.supabase.storage
            .from('business-images')
            .remove([fileName]);
        } catch (storageError) {
          console.warn('Failed to delete photo from storage:', storageError);
          // Continue with deletion even if storage cleanup fails
        }
      }
    }

    // Delete associated data in order (foreign key constraints)
    // 1. Delete business photos
    await req.supabase
      .from('business_photos')
      .delete()
      .eq('business_id', business_id);

    // 2. Delete business settings
    await req.supabase
      .from('business_settings')
      .delete()
      .eq('business_id', business_id);

    // 3. Delete reviews
    await req.supabase
      .from('reviews')
      .delete()
      .eq('business_id', business_id);

    // 4. Delete reservations
    await req.supabase
      .from('reservations')
      .delete()
      .eq('business_id', business_id);

    // 5. Finally, delete the business
    const { error: deleteError } = await req.supabase
      .from('businesses')
      .delete()
      .eq('id', business_id)
      .eq('user_id', user_id); // Double check ownership

    if (deleteError) {
      return res.status(400).json({ error: deleteError.message });
    }

    res.status(200).json({ 
      message: 'Business and all associated data deleted successfully',
      business_id: business_id
    });

  } catch (error) {
    console.error('Exception in deleteBusiness:', error);
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
  getWeeklyReservationStats,
  getBusinessSettings,
  updateBusinessSettings,
  getUserBusiness,
  updateBusiness,
  uploadBusinessPhotos,
  getBusinessPhotos,
  deleteBusinessPhoto,
  updateBusinessPhoto,
  deleteBusiness
}; 