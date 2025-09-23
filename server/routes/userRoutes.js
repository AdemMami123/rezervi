const express = require('express');
const { getUserBookings, updateUserBooking, getBookingDetails } = require('../controller/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All user routes require authentication
router.use(protect);

// Get user's bookings
router.get('/bookings', getUserBookings);

// Get specific booking details
router.get('/bookings/:id', getBookingDetails);

// Update user's booking (cancel, reschedule, etc.)
router.put('/bookings/:id', updateUserBooking);

module.exports = router;
