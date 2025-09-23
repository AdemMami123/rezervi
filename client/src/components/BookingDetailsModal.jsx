import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiCalendar, FiClock, FiUser, FiPhone, FiMail, FiMapPin, FiFileText, FiDollarSign } from 'react-icons/fi';
import { getBookingDetails } from '../utils/api';

const BookingDetailsModal = ({ isOpen, onClose, bookingId }) => {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && bookingId) {
      console.log('Modal opened with booking ID:', bookingId);
      fetchBookingDetails();
    } else if (isOpen && !bookingId) {
      console.error('Modal opened without booking ID');
      setError('No booking ID provided');
    }
  }, [isOpen, bookingId]);

  const fetchBookingDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching booking details for ID:', bookingId);
      const response = await getBookingDetails(bookingId);
      console.log('Booking details response:', response);
      setBooking(response.booking);
    } catch (err) {
      console.error('Error fetching booking details:', err);
      setError(err.response?.data?.error || 'Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'confirmed': 
        return { 
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: '✅',
          bgColor: 'bg-green-50'
        };
      case 'pending': 
        return { 
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: '⏳',
          bgColor: 'bg-yellow-50'
        };
      case 'cancelled': 
        return { 
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: '❌',
          bgColor: 'bg-red-50'
        };
      case 'completed': 
        return { 
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: '🎉',
          bgColor: 'bg-blue-50'
        };
      default: 
        return { 
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: '📅',
          bgColor: 'bg-gray-50'
        };
    }
  };

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

  if (!isOpen) return null;

  // If no booking ID is provided, show error
  if (isOpen && !bookingId) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6"
        >
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Error
            </h2>
            <p className="text-red-600 dark:text-red-400 mb-4">
              No booking ID provided
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Booking Details
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <FiX className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4">
              {error}
            </div>
          )}

          {booking && (
            <div className="space-y-6">
              {/* Debug info - remove this later */}
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-gray-100 p-2 rounded text-xs">
                  <pre>Booking ID: {bookingId}</pre>
                  <pre>Booking Object Keys: {Object.keys(booking).join(', ')}</pre>
                </div>
              )}

              {/* Status and Business Info */}
              <div className={`${getStatusConfig(booking.status).bgColor} rounded-xl p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm">
                      {getBusinessIcon(booking.business_type)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {booking.business_name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 capitalize">
                        {booking.business_type?.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${getStatusConfig(booking.status).color} border`}>
                    <span>{getStatusConfig(booking.status).icon}</span>
                    <span className="font-medium capitalize">{booking.status}</span>
                  </div>
                </div>

                {booking.business_location && (
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                    <FiMapPin className="w-4 h-4" />
                    <span>{booking.business_location}</span>
                  </div>
                )}
              </div>

              {/* Booking Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <FiCalendar className="w-5 h-5 text-blue-500" />
                    <h4 className="font-medium text-gray-900 dark:text-white">Date & Time</h4>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {new Date(booking.booking_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <FiClock className="w-4 h-4 text-purple-500" />
                    <p className="text-gray-600 dark:text-gray-400 font-medium">
                      {booking.booking_time}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <FiUser className="w-5 h-5 text-green-500" />
                    <h4 className="font-medium text-gray-900 dark:text-white">Customer Info</h4>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {booking.customer_name || 'N/A'}
                  </p>
                  {booking.customer_phone && (
                    <div className="flex items-center space-x-2 mt-2">
                      <FiPhone className="w-4 h-4 text-blue-500" />
                      <p className="text-gray-600 dark:text-gray-400">
                        {booking.customer_phone}
                      </p>
                    </div>
                  )}
                  {booking.customer_email && (
                    <div className="flex items-center space-x-2 mt-1">
                      <FiMail className="w-4 h-4 text-purple-500" />
                      <p className="text-gray-600 dark:text-gray-400">
                        {booking.customer_email}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Information */}
              {booking.amount > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <FiDollarSign className="w-5 h-5 text-green-500" />
                    <h4 className="font-medium text-gray-900 dark:text-white">Payment</h4>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {booking.amount} TND
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {booking.payment_method} • {booking.payment_status}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {booking.notes && (
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <FiFileText className="w-5 h-5 text-orange-500" />
                    <h4 className="font-medium text-gray-900 dark:text-white">Notes</h4>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">
                    {booking.notes}
                  </p>
                </div>
              )}

              {/* Business Contact */}
              {booking.business_phone && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    Business Contact
                  </h4>
                  <div className="flex items-center space-x-2">
                    <FiPhone className="w-4 h-4 text-blue-500" />
                    <a 
                      href={`tel:${booking.business_phone}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      {booking.business_phone}
                    </a>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="text-sm text-gray-500 dark:text-gray-400 border-t pt-4">
                <p>Booking created: {new Date(booking.created_at).toLocaleString()}</p>
                {booking.updated_at !== booking.created_at && (
                  <p>Last updated: {new Date(booking.updated_at).toLocaleString()}</p>
                )}
              </div>
            </div>
          )}

          {/* Close Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BookingDetailsModal;