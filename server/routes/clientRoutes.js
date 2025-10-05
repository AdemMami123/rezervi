const express = require('express');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { 
  getBusinesses, 
  getBusinessDetails, 
  getBusinessAvailability,
  createBooking,
  getBusinessPhotosPublic
} = require('../controller/clientController');

const router = express.Router();

// Public routes (no auth required)
// NOTE: More specific routes MUST come before generic :id routes
router.get('/businesses/discover', getBusinesses);
router.get('/businesses/:id/photos', getBusinessPhotosPublic);
router.get('/businesses/:id/availability', getBusinessAvailability);
router.get('/businesses/:id', getBusinessDetails);

// Booking route with optional authentication (user can book with or without account)
router.post('/bookings', optionalAuth, createBooking);

// Protected routes (auth required) - for later implementation
// router.use(protect);
// router.get('/bookings', getUserBookings);
// router.put('/bookings/:id', updateBookingStatus);

module.exports = router;
