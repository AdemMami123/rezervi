const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { registerBusiness, getBusinessReservations, updateReservationStatus, getBusinessSettings, updateBusinessSettings, getUserBusiness, updateBusiness } = require('../controller/businessController');

const router = express.Router();

// Protect all business routes
router.use(protect);

router.post('/register', registerBusiness);
router.get('/reservations', getBusinessReservations);
router.put('/reservations/:id', updateReservationStatus);
router.get('/settings', getBusinessSettings);
router.put('/settings', updateBusinessSettings);
router.get('/user-business', getUserBusiness);
router.put('/update', updateBusiness);

module.exports = router; 