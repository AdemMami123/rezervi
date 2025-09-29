const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  submitReview,
  getBusinessReviews,
  getBusinessRatings,
  updateReview,
  deleteReview,
  canUserReview
} = require('../controller/reviewController');

const router = express.Router();

// Public routes (no authentication required)
router.get('/business/:business_id', getBusinessReviews); // Get reviews for a specific business
router.get('/ratings', getBusinessRatings); // Get all business ratings for discovery page

// Protected routes (authentication required)
router.use(protect);

router.post('/submit', submitReview); // Submit a new review
router.put('/:review_id', updateReview); // Update a review
router.delete('/:review_id', deleteReview); // Delete a review
router.get('/can-review/:business_id', canUserReview); // Check if user can review a business

module.exports = router;