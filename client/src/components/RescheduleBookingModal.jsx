import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiCalendar, FiClock } from 'react-icons/fi';
import { rescheduleBooking, getBusinessAvailability } from '../utils/api';

const RescheduleBookingModal = ({ isOpen, onClose, booking, onBookingUpdated }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedDate('');
      setSelectedTime('');
      setAvailableSlots([]);
      setError(null);
    }
  }, [isOpen]);

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Get maximum date (3 months from now)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    return maxDate.toISOString().split('T')[0];
  };

  // Fetch available time slots when date is selected
  useEffect(() => {
    if (selectedDate && booking) {
      fetchAvailableSlots();
    }
  }, [selectedDate, booking]);

  const fetchAvailableSlots = async () => {
    setLoadingSlots(true);
    setSelectedTime('');
    try {
      const availability = await getBusinessAvailability(booking.business_id, selectedDate);
      console.log('Availability response:', availability); // Debug log
      // The API returns 'slots' property, not 'availableSlots'
      setAvailableSlots(availability.slots || availability.availableSlots || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching availability:', err);
      setError('Failed to load available time slots');
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleReschedule = async () => {
    if (!booking || !selectedDate || !selectedTime) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await rescheduleBooking(booking.id, selectedDate, selectedTime);
      onBookingUpdated(response.booking);
      onClose();
      resetForm();
    } catch (err) {
      setError(err.message || 'Failed to reschedule booking');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedDate('');
    setSelectedTime('');
    setAvailableSlots([]);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen || !booking) return null;

  const isFormValid = selectedDate && selectedTime;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <FiCalendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Reschedule Booking
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <FiX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Current Booking Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Current Booking
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {booking.business_name}
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
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

          {/* Date Selection */}
          <div className="mb-6">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FiCalendar className="w-4 h-4" />
              <span>Select New Date</span>
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={getMinDate()}
              max={getMaxDate()}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Time Selection */}
          <div className="mb-6">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FiClock className="w-4 h-4" />
              <span>Select New Time</span>
            </label>
            
            {selectedDate && (
              <div>
                {loadingSlots ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading available times...</span>
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedTime(slot)}
                        className={`p-2 text-sm rounded-lg border transition-colors ${
                          selectedTime === slot
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    No available time slots for this date
                  </div>
                )}
              </div>
            )}
            
            {!selectedDate && (
              <div className="text-center py-4 text-gray-400 dark:text-gray-500 text-sm">
                Please select a date first
              </div>
            )}
          </div>

          {/* Information */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              <strong>Note:</strong> You can reschedule your booking up to 24 hours before the original appointment time.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleReschedule}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                isFormValid
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={loading || !isFormValid}
            >
              {loading ? 'Rescheduling...' : 'Reschedule'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RescheduleBookingModal;