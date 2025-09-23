const express = require('express');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { 
  getBusinesses, 
  getBusinessDetails, 
  getBusinessAvailability,
  createBooking
} = require('../controller/clientController');

const router = express.Router();

// Public routes (no auth required)
router.get('/businesses/discover', getBusinesses);
router.get('/businesses/:id', getBusinessDetails);
router.get('/businesses/:id/availability', getBusinessAvailability);

// Booking route with optional authentication (user can book with or without account)
router.post('/bookings', optionalAuth, createBooking);

// Protected routes (auth required) - for later implementation
// router.use(protect);
// router.get('/bookings', getUserBookings);
// router.put('/bookings/:id', updateBookingStatus);

module.exports = router;
