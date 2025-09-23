const express = require('express');
const { getUserBookings, updateUserBooking } = require('../controller/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All user routes require authentication
router.use(protect);

// Get user's bookings
router.get('/bookings', getUserBookings);

// Update user's booking (cancel, reschedule, etc.)
router.put('/bookings/:id', updateUserBooking);

module.exports = router;
