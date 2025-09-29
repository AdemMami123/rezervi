import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import StarRating from './StarRating';
import RatingModal from './RatingModal';
import ReviewsList from './ReviewsList';
import API from '../utils/api';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const BusinessDetailModal = ({ business, onClose, onBookNow }) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [currentRating, setCurrentRating] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuthStatus = async () => {
    try {
      // Try to make an authenticated request to check if user is logged in
      const response = await API.get('/auth/me');
      setIsAuthenticated(true);
    } catch (error) {
      setIsAuthenticated(false);
    }
  };

  const checkReviewPermission = async () => {
    if (!isAuthenticated || !business?.id) return;
    
    try {
      const response = await API.get(`/api/reviews/can-review/${business.id}`);
      setCanReview(response.data.canReview);
      setExistingReview(response.data.existingReview);
    } catch (error) {
      console.error('Error checking review permission:', error);
    }
  };

  useEffect(() => {
    if (business?.id) {
      checkAuthStatus();
    }
  }, [business?.id]);

  useEffect(() => {
    if (isAuthenticated && business?.id) {
      checkReviewPermission();
    }
  }, [isAuthenticated, business?.id]);

  const handleReviewSubmitted = (newReview) => {
    setExistingReview(newReview);
    setCanReview(false);
    // The ReviewsList component will update automatically
  };

  const handleRatingUpdate = (ratingData) => {
    setCurrentRating(ratingData);
  };
  
  if (!business) return null;

  const getBusinessIcon = (type) => {
    const icons = {
      barbershop: '✂️',
      beauty_salon: '💄',
      restaurant: '🍽️',
      cafe: '☕',
      football_field: '⚽',
      tennis_court: '🎾',
      gym: '🏋️',
      car_wash: '🚗',
      spa: '🧘',
      dentist: '🦷',
      doctor: '👩‍⚕️',
      other: '🏢'
    };
    return icons[type] || icons.other;
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      >
        <motion.div 
          className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto dark:bg-gray-800 shadow-2xl"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.3, stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center">
            <span className="text-3xl mr-4">{getBusinessIcon(business.type)}</span>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{business.name}</h2>
              <p className="text-gray-600 capitalize dark:text-gray-300">{business.type.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl dark:text-gray-500 dark:hover:text-gray-300"
          >
            ×
          </button>
        </div>

        {/* Content - Multi-column Layout */}
        <div className="p-6">
          {/* Business Photos Section - Full Width */}
          {business.photos && business.photos.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 dark:text-white">Photos</h3>
              <div className="space-y-4">
                {/* Main Photo Display */}
                <div className="relative">
                  <img
                    src={business.photos[selectedPhotoIndex]?.photo_url}
                    alt={`${business.name} - Photo ${selectedPhotoIndex + 1}`}
                    className="w-full h-72 object-cover rounded-xl shadow-lg"
                  />
                  {business.photos.length > 1 && (
                    <>
                      {/* Previous Button */}
                      <button
                        onClick={() => setSelectedPhotoIndex(
                          selectedPhotoIndex === 0 ? business.photos.length - 1 : selectedPhotoIndex - 1
                        )}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-70 transition-all backdrop-blur-sm"
                      >
                        ‹
                      </button>
                      {/* Next Button */}
                      <button
                        onClick={() => setSelectedPhotoIndex(
                          selectedPhotoIndex === business.photos.length - 1 ? 0 : selectedPhotoIndex + 1
                        )}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-70 transition-all backdrop-blur-sm"
                      >
                        ›
                      </button>
                      {/* Photo Counter */}
                      <div className="absolute bottom-4 right-4 bg-black bg-opacity-60 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm">
                        {selectedPhotoIndex + 1} / {business.photos.length}
                      </div>
                    </>
                  )}
                </div>
                
                {/* Photo Thumbnails */}
                {business.photos.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {business.photos.map((photo, index) => (
                      <button
                        key={photo.id}
                        onClick={() => setSelectedPhotoIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-3 transition-all ${
                          selectedPhotoIndex === index 
                            ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg' 
                            : 'border-gray-300 hover:border-gray-400 hover:shadow-md'
                        }`}
                      >
                        <img
                          src={photo.photo_url}
                          alt={`${business.name} - Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main Content - Multi-column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-8">
            
            {/* Column 1: Basic Info & Description */}
            <div className="space-y-6">
              {/* Location */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 md:p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 dark:text-white flex items-center">
                  <span className="mr-2">📍</span>
                  Location
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base">
                  {business.location}
                </p>
              </div>

              {/* Rating & Reviews Section */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-xl border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Reviews & Ratings
                  </h3>
                  {isAuthenticated && canReview && (
                    <button
                      onClick={(e) => {
                        console.log('Write Review button clicked');
                        e.stopPropagation();
                        e.preventDefault();
                        setShowRatingModal(true);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Write Review
                    </button>
                  )}
                  {existingReview && (
                    <button
                      onClick={(e) => {
                        console.log('Update Review button clicked');
                        e.stopPropagation();
                        e.preventDefault();
                        setShowRatingModal(true);
                      }}
                      className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Update Review
                    </button>
                  )}
                </div>

                {/* Current Rating Display */}
                {(currentRating || (business.rating && business.rating.totalReviews > 0)) && (
                  <div className="flex items-center mb-4">
                    <StarRating 
                      rating={currentRating?.averageRating || business.rating?.averageRating || 0} 
                      readonly 
                      size="lg" 
                      showValue 
                    />
                    <span className="text-gray-500 ml-2 dark:text-gray-400 text-sm">
                      ({(currentRating?.totalReviews || business.rating?.totalReviews || 0)} review{(currentRating?.totalReviews || business.rating?.totalReviews || 0) !== 1 ? 's' : ''})
                    </span>
                  </div>
                )}

                {/* Reviews List */}
                <ReviewsList 
                  businessId={business.id} 
                  onReviewUpdate={handleRatingUpdate}
                />

                {!isAuthenticated && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <a href="/login" className="text-blue-600 hover:text-blue-800">Sign in</a> to write a review
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              {business.description && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 dark:text-white">About</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{business.description}</p>
                </div>
              )}
            </div>

            {/* Column 2: Operating Hours & Services */}
            <div className="lg:col-span-1 space-y-6">
              {/* Operating Hours */}
              <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 dark:text-white flex items-center">
                  <span className="mr-2">🕐</span>
                  Operating Hours
                </h3>
                <div className="space-y-2 text-gray-600 dark:text-gray-300">
                  {business.business_hours ? (
                    Object.entries(business.business_hours).map(([day, hours]) => (
                      <div key={day} className="flex justify-between">
                        <span className="capitalize">{day}</span>
                        <span className="font-medium">
                          {hours.isOpen ? `${hours.openTime} - ${hours.closeTime}` : 'Closed'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <span className="text-gray-500 dark:text-gray-400">Hours not set</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Services/Amenities */}
              <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl border border-purple-200 dark:border-purple-800">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 dark:text-white flex items-center">
                  <span className="mr-2">⚡</span>
                  Services
                </h3>
                <div className="flex flex-wrap gap-2">
                  {getServicesForType(business.type).map((service, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium dark:bg-purple-900 dark:text-purple-200 transition-all hover:shadow-md"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 3: Contact Info & Social Media */}
            <div className="md:col-span-2 lg:col-span-1 space-y-6">
              {/* Contact Info */}
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-xl border border-indigo-200 dark:border-indigo-800">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 dark:text-white flex items-center">
                  <span className="mr-2">📞</span>
                  Contact
                </h3>
                <div className="space-y-3">
                  {business.phone && (
                    <div className="flex items-center text-gray-600 dark:text-gray-300">
                      <span className="mr-3 text-lg">�</span>
                      <span className="font-medium">{business.phone}</span>
                    </div>
                  )}
                  {business.email && (
                    <div className="flex items-center text-gray-600 dark:text-gray-300">
                      <span className="mr-3 text-lg">✉️</span>
                      <span className="font-medium">{business.email}</span>
                    </div>
                  )}
                  {business.website && (
                    <div className="flex items-center">
                      <span className="mr-3 text-lg">🌐</span>
                      <a
                        href={business.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline dark:text-indigo-400 transition-colors"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Social Media */}
              {(business.instagram_url || business.facebook_url) && (
                <div className="bg-pink-50 dark:bg-pink-900/20 p-6 rounded-xl border border-pink-200 dark:border-pink-800">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 dark:text-white flex items-center">
                    <span className="mr-2">🌟</span>
                    Follow Us
                  </h3>
                  <div className="flex flex-col space-y-3">
                    {business.instagram_url && (
                      <a
                        href={business.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-md"
                      >
                        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.621 5.367 11.988 11.988 11.988s11.987-5.367 11.987-11.988C24.004 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.896 3.708 13.745 3.708 12.448s.49-2.448 1.297-3.323C5.901 8.198 7.052 7.708 8.349 7.708s2.448.49 3.323 1.297c.896.896 1.386 2.047 1.386 3.344s-.49 2.448-1.386 3.323c-.875.807-2.026 1.297-3.323 1.297z"/>
                        </svg>
                        <span className="font-medium">Instagram</span>
                      </a>
                    )}
                    {business.facebook_url && (
                      <a
                        href={business.facebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 shadow-md"
                      >
                        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        <span className="font-medium">Facebook</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Map Section - Full Width Below Columns */}
        {business.latitude && business.longitude && (
          <div className="px-6 pb-6">
            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 dark:text-white flex items-center">
                <span className="mr-2">🗺️</span>
                Location on Map
              </h3>
              <div className="h-80 rounded-xl overflow-hidden shadow-lg border-2 border-gray-200 dark:border-gray-600">
                <MapContainer
                  center={[business.latitude, business.longitude]}
                  zoom={15}
                  scrollWheelZoom={false}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[business.latitude, business.longitude]}>
                    <Popup>
                      <div className="text-center p-2">
                        <strong className="text-lg">{business.name}</strong><br />
                        <span className="text-sm text-gray-600">{business.location}</span><br />
                        <small className="text-xs text-gray-500">
                          Lat: {business.latitude}, Lng: {business.longitude}
                        </small>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 md:px-6 py-6 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-b-xl">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium dark:text-gray-200 dark:bg-gray-600 dark:border-gray-500 dark:hover:bg-gray-500"
            >
              Close
            </button>
            <button
              onClick={onBookNow}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-[1.02] font-medium shadow-lg hover:shadow-xl dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700"
            >
              📅 Book Appointment
            </button>
          </div>
        </div>
        </motion.div>

        {/* Rating Modal */}
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => {
            console.log('Rating modal closing');
            setShowRatingModal(false);
          }}
          businessId={business.id}
          businessName={business.name}
          existingReview={existingReview}
          onReviewSubmitted={handleReviewSubmitted}
        />
      </motion.div>
    </AnimatePresence>
  );
};

// Helper function to get services based on business type
const getServicesForType = (type) => {
  const services = {
    barbershop: ['Haircut', 'Beard Trim', 'Shave', 'Hair Styling'],
    beauty_salon: ['Hair Styling', 'Manicure', 'Pedicure', 'Facial', 'Makeup'],
    restaurant: ['Dine-in', 'Takeout', 'Delivery', 'Catering'],
    cafe: ['Coffee', 'Pastries', 'Light Meals', 'Wi-Fi'],
    football_field: ['Field Rental', 'Equipment Rental', 'Coaching'],
    tennis_court: ['Court Rental', 'Equipment Rental', 'Lessons'],
    gym: ['Weight Training', 'Cardio', 'Personal Training', 'Group Classes'],
    car_wash: ['Exterior Wash', 'Interior Cleaning', 'Wax', 'Detailing'],
    spa: ['Massage', 'Facial', 'Body Treatment', 'Relaxation'],
    dentist: ['Cleaning', 'Check-up', 'Fillings', 'Orthodontics'],
    doctor: ['Consultation', 'Check-up', 'Diagnosis', 'Treatment'],
    other: ['Various Services']
  };
  return services[type] || services.other;
};

export default BusinessDetailModal;
