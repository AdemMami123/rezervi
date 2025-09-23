import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BusinessDetailModal = ({ business, onClose, onBookNow }) => {
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
          className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto dark:bg-gray-800"
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

        {/* Content */}
        <div className="p-6">
          {/* Location */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 dark:text-white">Location</h3>
            <p className="text-gray-600 flex items-center dark:text-gray-400">
              <span className="mr-2">📍</span>
              {business.location}
            </p>
          </div>

          {/* Description */}
          {business.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 dark:text-white">About</h3>
              <p className="text-gray-600 dark:text-gray-400">{business.description}</p>
            </div>
          )}

          {/* Rating */}
          {business.rating && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 dark:text-white">Rating</h3>
              <div className="flex items-center">
                <span className="text-yellow-400 text-xl mr-2">⭐</span>
                <span className="text-lg font-medium dark:text-white">{business.rating}/5</span>
                <span className="text-gray-500 ml-2 dark:text-gray-400">
                  ({business.review_count || 0} reviews)
                </span>
              </div>
            </div>
          )}

          {/* Operating Hours */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 dark:text-white">Operating Hours</h3>
            <div className="text-gray-600 dark:text-gray-400">
              <p>Monday - Friday: 9:00 AM - 8:00 PM</p>
              <p>Saturday: 9:00 AM - 6:00 PM</p>
              <p>Sunday: 10:00 AM - 4:00 PM</p>
            </div>
          </div>

          {/* Services/Amenities */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 dark:text-white">Services</h3>
            <div className="flex flex-wrap gap-2">
              {getServicesForType(business.type).map((service, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm dark:bg-blue-900 dark:text-blue-200"
                >
                  {service}
                </span>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 dark:text-white">Contact</h3>
            <div className="space-y-2">
              {business.phone && (
                <p className="text-gray-600 flex items-center dark:text-gray-400">
                  <span className="mr-2">📞</span>
                  {business.phone}
                </p>
              )}
              {business.email && (
                <p className="text-gray-600 flex items-center dark:text-gray-400">
                  <span className="mr-2">✉️</span>
                  {business.email}
                </p>
              )}
              {business.website && (
                <p className="text-gray-600 flex items-center dark:text-gray-400">
                  <span className="mr-2">🌐</span>
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {business.website}
                  </a>
                </p>
              )}
            </div>
          </div>

          {/* Map placeholder */}
          {business.latitude && business.longitude && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 dark:text-white">Location on Map</h3>
              <div className="bg-gray-200 h-48 rounded-lg flex items-center justify-center dark:bg-gray-700">
                <p className="text-gray-500 dark:text-gray-400 text-center">
                  Map showing {business.name} location
                  <br />
                  <small>Lat: {business.latitude}, Lng: {business.longitude}</small>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3 dark:border-gray-600">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Close
          </button>
          <button
            onClick={onBookNow}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Book Appointment
          </button>
        </div>
        </motion.div>
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
