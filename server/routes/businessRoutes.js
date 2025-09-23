const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { 
  registerBusiness, 
  getBusinessReservations, 
  updateReservationStatus, 
  acceptReservation, 
  declineReservation, 
  getReservationStats,
  getBusinessSettings, 
  updateBusinessSettings, 
  getUserBusiness, 
  updateBusiness 
} = require('../controller/businessController');

const router = express.Router();

// Protect all business routes
router.use(protect);

// Business registration and management
router.post('/register', registerBusiness);
router.get('/user-business', getUserBusiness);
router.put('/update', updateBusiness);

// Reservation management
router.get('/reservations', getBusinessReservations);
router.put('/reservations/:id', updateReservationStatus);
router.put('/reservations/:id/accept', acceptReservation);
router.put('/reservations/:id/decline', declineReservation);
router.get('/reservations/stats', getReservationStats);

// Business settings
router.get('/settings', getBusinessSettings);
router.put('/settings', updateBusinessSettings);

module.exports = router; 