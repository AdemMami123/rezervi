import React from 'react';
import { motion } from 'framer-motion';
import { FiX, FiCalendar, FiClock, FiUser, FiPhone, FiMail, FiMapPin, FiFileText, FiDollarSign, FiEdit } from 'react-icons/fi';

const SimpleBookingDetailsModal = ({ isOpen, onClose, booking, onReschedule }) => {
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

  if (!booking) {
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
              No booking data available
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
            <div className="flex items-center space-x-2">
              {/* Reschedule Button - only show for confirmed or pending bookings */}
              {(booking.status === 'confirmed' || booking.status === 'pending') && onReschedule && (
                <button
                  onClick={() => {
                    onReschedule(booking);
                    onClose();
                  }}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <FiEdit className="w-4 h-4 mr-1" />
                  Reschedule
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <FiX className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Status and Business Info */}
            <div className={`${getStatusConfig(booking.status).bgColor} rounded-xl p-6`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm">
                    {getBusinessIcon(booking.business_type)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {booking.business_name || booking.businesses?.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 capitalize">
                      {(booking.business_type || booking.businesses?.type)?.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${getStatusConfig(booking.status).color} border`}>
                  <span>{getStatusConfig(booking.status).icon}</span>
                  <span className="font-medium capitalize">{booking.status}</span>
                </div>
              </div>

              {(booking.business_location || booking.businesses?.location) && (
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <FiMapPin className="w-4 h-4" />
                  <span className="text-sm">{booking.business_location || booking.businesses?.location}</span>
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
                  {new Date(booking.booking_date || booking.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <FiClock className="w-4 h-4 text-purple-500" />
                  <p className="text-gray-600 dark:text-gray-400 font-medium">
                    {(booking.booking_time || booking.time)?.substring(0, 5)} {/* Remove seconds from time */}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <FiUser className="w-5 h-5 text-green-500" />
                  <h4 className="font-medium text-gray-900 dark:text-white">Booking Info</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Booking ID:</span>
                    <span className="text-sm font-mono text-gray-900 dark:text-white">
                      {booking.id.substring(0, 8)}...
                    </span>
                  </div>
                  {booking.customer_name && (
                    <div className="flex items-center space-x-2">
                      <FiUser className="w-4 h-4 text-blue-500" />
                      <p className="text-gray-600 dark:text-gray-400">{booking.customer_name}</p>
                    </div>
                  )}
                  {booking.customer_phone && (
                    <div className="flex items-center space-x-2">
                      <FiPhone className="w-4 h-4 text-blue-500" />
                      <p className="text-gray-600 dark:text-gray-400">{booking.customer_phone}</p>
                    </div>
                  )}
                  {booking.customer_email && (
                    <div className="flex items-center space-x-2">
                      <FiMail className="w-4 h-4 text-purple-500" />
                      <p className="text-gray-600 dark:text-gray-400">{booking.customer_email}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-3">
                <FiDollarSign className="w-5 h-5 text-blue-500" />
                <h4 className="font-medium text-gray-900 dark:text-white">Payment Information</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    booking.payment_status === 'paid' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : booking.payment_status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  }`}>
                    {booking.payment_status === 'paid' ? '💰' : booking.payment_status === 'pending' ? '⏳' : '❌'}
                    <span className="ml-1 capitalize">{booking.payment_status}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Method</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {booking.payment_method || 'Cash'}
                  </p>
                </div>
              </div>
              {booking.amount && booking.amount > 0 && (
                <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {booking.amount} TND
                  </p>
                </div>
              )}
            </div>

            {/* Business Contact Info */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-3">
                <FiPhone className="w-5 h-5 text-purple-500" />
                <h4 className="font-medium text-gray-900 dark:text-white">Business Contact</h4>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Business Name:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {booking.business_name || booking.businesses?.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Type:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {(booking.business_type || booking.businesses?.type)?.replace('_', ' ')}
                  </span>
                </div>
                {booking.business_phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Phone:</span>
                    <a 
                      href={`tel:${booking.business_phone}`}
                      className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {booking.business_phone}
                    </a>
                  </div>
                )}
                {booking.business_email && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Email:</span>
                    <a 
                      href={`mailto:${booking.business_email}`}
                      className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {booking.business_email}
                    </a>
                  </div>
                )}
              </div>
            </div>

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

            {/* Booking Timeline */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-3">
                <FiClock className="w-5 h-5 text-gray-500" />
                <h4 className="font-medium text-gray-900 dark:text-white">Booking Timeline</h4>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Created:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(booking.created_at).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                {booking.updated_at && booking.updated_at !== booking.created_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Last Updated:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(booking.updated_at).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Close Button */}
          <div className="mt-6 flex justify-between items-center">
            <div className="flex space-x-3">
              {(booking.status === 'confirmed' || booking.status === 'pending') && onReschedule && (
                <button
                  onClick={() => {
                    onReschedule(booking);
                    // Don't close immediately, let the parent handle modal state
                  }}
                  className="flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
                >
                  <FiEdit className="w-4 h-4 mr-2" />
                  Reschedule Booking
                </button>
              )}
            </div>
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

export default SimpleBookingDetailsModal;