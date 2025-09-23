import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiAlertTriangle } from 'react-icons/fi';
import { cancelBooking } from '../utils/api';

const CancelBookingModal = ({ isOpen, onClose, booking, onBookingUpdated }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCancel = async () => {
    if (!booking) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await cancelBooking(booking.id, reason);
      onBookingUpdated(response.booking);
      onClose();
      setReason('');
    } catch (err) {
      setError(err.message || 'Failed to cancel booking');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setError(null);
    onClose();
  };

  if (!isOpen || !booking) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <FiAlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Cancel Booking
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <FiX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Booking Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              {booking.business_name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {new Date(booking.booking_date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })} at {booking.booking_time}
            </p>
          </div>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
              {error}
            </div>
          )}

          {/* Warning */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
            <p className="text-amber-800 dark:text-amber-200 text-sm">
              <strong>Warning:</strong> This action cannot be undone. Please contact the business if you need to reschedule instead of canceling.
            </p>
          </div>

          {/* Reason Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reason for cancellation (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a reason for canceling..."
              rows={3}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              disabled={loading}
            >
              Keep Booking
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              disabled={loading}
            >
              {loading ? 'Canceling...' : 'Cancel Booking'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CancelBookingModal;