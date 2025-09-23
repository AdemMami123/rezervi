const express = require('express');
const multer = require('multer');
const { register, login, logout, getMe, updateProfile, uploadProfilePicture } = require('../controller/authController');
const { protect } = require('../middleware/authMiddleware');

// Setup multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  }
});

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/profile-picture', protect, upload.single('profile_picture'), uploadProfilePicture);

module.exports = router; 