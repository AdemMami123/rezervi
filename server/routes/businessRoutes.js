const express = require('express');
const multer = require('multer');
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
  updateBusiness,
  uploadBusinessPhotos,
  getBusinessPhotos,
  deleteBusinessPhoto,
  updateBusinessPhoto,
  deleteBusiness
} = require('../controller/businessController');

// Setup multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 10 // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

const router = express.Router();

// Protect all business routes
router.use(protect);

// Business registration and management
router.post('/register', upload.array('business_photos', 10), registerBusiness);
router.get('/user-business', getUserBusiness);
router.put('/update', updateBusiness);
router.delete('/delete', deleteBusiness);

// Photo management
router.post('/photos', upload.array('business_photos', 10), uploadBusinessPhotos);
router.get('/:business_id/photos', getBusinessPhotos);
router.delete('/photos/:photo_id', deleteBusinessPhoto);
router.put('/photos/:photo_id', updateBusinessPhoto);

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