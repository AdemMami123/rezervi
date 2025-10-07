const supabase = require('../supabaseClient');

// Submit a new review
const submitReview = async (req, res) => {
  try {
    const { business_id, rating, comment = '' } = req.body;
    const client_id = req.user.id;

    // Validate input
    if (!business_id || !rating) {
      return res.status(400).json({ error: 'Business ID and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if business exists
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', business_id)
      .single();

    if (businessError || !business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Check if user has already reviewed this business
    const { data: existingReview, error: checkError } = await supabase
      .from('reviews')
      .select('id')
      .eq('client_id', client_id)
      .eq('business_id', business_id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" which is what we want
      console.error('Error checking existing review:', checkError);
      return res.status(500).json({ error: 'Database error' });
    }

    if (existingReview) {
      return res.status(409).json({ error: 'You have already reviewed this business' });
    }

    // Optional: Check if user has completed a reservation (uncomment if needed)
    /*
    const { data: completedReservation } = await supabase
      .from('reservations')
      .select('id')
      .eq('client_id', client_id)
      .eq('business_id', business_id)
      .eq('status', 'completed')
      .limit(1);

    if (!completedReservation || completedReservation.length === 0) {
      return res.status(403).json({ error: 'You can only review businesses you have visited' });
    }
    */

    // Insert the new review
    const { data: newReview, error: insertError } = await supabase
      .from('reviews')
      .insert({
        client_id,
        business_id,
        rating: parseInt(rating),
        comment: comment.trim()
      })
      .select('*, users(username)')
      .single();

    if (insertError) {
      console.error('Error inserting review:', insertError);
      return res.status(500).json({ error: 'Failed to submit review' });
    }

    res.status(201).json({
      success: true,
      review: newReview,
      message: 'Review submitted successfully'
    });
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get reviews for a business
const getBusinessReviews = async (req, res) => {
  try {
    const { business_id } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    if (!business_id) {
      return res.status(400).json({ error: 'Business ID is required' });
    }

    // Get reviews with user information
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        client_id,
        users(username)
      `)
      .eq('business_id', business_id)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
      return res.status(500).json({ error: 'Failed to fetch reviews' });
    }

    // Get email addresses for reviewers from auth.users
    if (reviews && reviews.length > 0) {
      const userIds = reviews.map(review => review.client_id);
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (!authError && authUsers) {
        // Create a map of user IDs to emails
        const userEmailMap = {};
        authUsers.users.forEach(user => {
          userEmailMap[user.id] = user.email;
        });

        // Add email to each review
        reviews.forEach(review => {
          review.user_email = userEmailMap[review.client_id] || null;
        });
      }
    }

    // Get review statistics
    const { data: stats, error: statsError } = await supabase
      .from('reviews')
      .select('rating')
      .eq('business_id', business_id);

    if (statsError) {
      console.error('Error fetching review stats:', statsError);
      return res.status(500).json({ error: 'Failed to fetch review statistics' });
    }

    // Calculate statistics
    const totalReviews = stats.length;
    const averageRating = totalReviews > 0 
      ? stats.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;

    // Count ratings by star level
    const ratingDistribution = {
      1: stats.filter(r => r.rating === 1).length,
      2: stats.filter(r => r.rating === 2).length,
      3: stats.filter(r => r.rating === 3).length,
      4: stats.filter(r => r.rating === 4).length,
      5: stats.filter(r => r.rating === 5).length
    };

    res.json({
      reviews,
      stats: {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution
      },
      pagination: {
        offset: parseInt(offset),
        limit: parseInt(limit),
        hasMore: reviews.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get business reviews error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all reviews with business ratings for discovery page
const getBusinessRatings = async (req, res) => {
  try {
    // Get all businesses with their average ratings
    const { data: businesses, error: businessesError } = await supabase
      .from('businesses')
      .select('id, name');

    if (businessesError) {
      console.error('Error fetching businesses:', businessesError);
      return res.status(500).json({ error: 'Failed to fetch businesses' });
    }

    // Get all reviews and calculate averages
    const { data: allReviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('business_id, rating');

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
      return res.status(500).json({ error: 'Failed to fetch reviews' });
    }

    // Calculate ratings for each business
    const businessRatings = {};
    
    // Group reviews by business_id
    const reviewsByBusiness = allReviews.reduce((acc, review) => {
      if (!acc[review.business_id]) {
        acc[review.business_id] = [];
      }
      acc[review.business_id].push(review.rating);
      return acc;
    }, {});

    // Calculate averages
    Object.keys(reviewsByBusiness).forEach(businessId => {
      const ratings = reviewsByBusiness[businessId];
      const totalReviews = ratings.length;
      const averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / totalReviews;
      
      businessRatings[businessId] = {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews
      };
    });

    res.json({ businessRatings });
  } catch (error) {
    console.error('Get business ratings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update a review (only by the author)
const updateReview = async (req, res) => {
  try {
    const { review_id } = req.params;
    const { rating, comment } = req.body;
    const client_id = req.user.id;

    // Validate input
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if review exists and belongs to the user
    const { data: existingReview, error: checkError } = await supabase
      .from('reviews')
      .select('client_id')
      .eq('id', review_id)
      .single();

    if (checkError || !existingReview) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (existingReview.client_id !== client_id) {
      return res.status(403).json({ error: 'You can only update your own reviews' });
    }

    // Prepare update data
    const updateData = {};
    if (rating !== undefined) updateData.rating = parseInt(rating);
    if (comment !== undefined) updateData.comment = comment.trim();

    // Update the review
    const { data: updatedReview, error: updateError } = await supabase
      .from('reviews')
      .update(updateData)
      .eq('id', review_id)
      .select('*, users(username)')
      .single();

    if (updateError) {
      console.error('Error updating review:', updateError);
      return res.status(500).json({ error: 'Failed to update review' });
    }

    res.json({
      success: true,
      review: updatedReview,
      message: 'Review updated successfully'
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a review (only by the author)
const deleteReview = async (req, res) => {
  try {
    const { review_id } = req.params;
    const client_id = req.user.id;

    // Check if review exists and belongs to the user
    const { data: existingReview, error: checkError } = await supabase
      .from('reviews')
      .select('client_id')
      .eq('id', review_id)
      .single();

    if (checkError || !existingReview) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (existingReview.client_id !== client_id) {
      return res.status(403).json({ error: 'You can only delete your own reviews' });
    }

    // Delete the review
    const { error: deleteError } = await supabase
      .from('reviews')
      .delete()
      .eq('id', review_id);

    if (deleteError) {
      console.error('Error deleting review:', deleteError);
      return res.status(500).json({ error: 'Failed to delete review' });
    }

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Check if user can review a business
const canUserReview = async (req, res) => {
  try {
    const { business_id } = req.params;
    const client_id = req.user.id;

    if (!business_id) {
      return res.status(400).json({ error: 'Business ID is required' });
    }

    // Check if business exists
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', business_id)
      .single();

    if (businessError || !business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Check if user has already reviewed this business
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at')
      .eq('client_id', client_id)
      .eq('business_id', business_id)
      .single();

    const hasReviewed = !!existingReview;

    // Optional: Check if user has completed a reservation
    const { data: completedReservations } = await supabase
      .from('reservations')
      .select('id')
      .eq('client_id', client_id)
      .eq('business_id', business_id);

    const hasVisited = completedReservations && completedReservations.length > 0;

    res.json({
      canReview: !hasReviewed,
      hasReviewed,
      hasVisited,
      existingReview: existingReview || null
    });
  } catch (error) {
    console.error('Can user review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  submitReview,
  getBusinessReviews,
  getBusinessRatings,
  updateReview,
  deleteReview,
  canUserReview
};