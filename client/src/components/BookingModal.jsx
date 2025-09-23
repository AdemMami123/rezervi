import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createBooking, getBusinessAvailability } from '../utils/api';

const BookingModal = ({ business, isOpen, onClose, onBookingSuccess }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Reset all states when modal opens
      setSelectedDate('');
      setSelectedTime('');
      setAvailableSlots([]);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setNotes('');
      setPaymentMethod('cash');
      setError('');
      setSuccess('');
      setConfirmationCode('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDate]);

  const fetchAvailableSlots = async () => {
    try {
      const response = await getBusinessAvailability(business.id, selectedDate);
      setAvailableSlots(response.slots || []);
    } catch (err) {
      console.error('Error fetching availability:', err);
      setError('Failed to load available time slots');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) {
      setError('Please select both date and time');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      setError('Please enter your name and phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const bookingData = {
        business_id: business.id,
        booking_date: selectedDate,
        booking_time: selectedTime,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim(),
        notes: notes.trim(),
        payment_method: paymentMethod
      };

      const response = await createBooking(bookingData);
      
      if (response.success && response.booking) {
        console.log('Booking created successfully:', response);
        
        // Clear any previous errors
        setError(''); 
        
        // Set success state
        const code = response.confirmationCode || response.booking.id || 'N/A';
        setConfirmationCode(code);
        setSuccess(`Booking confirmed successfully! Your confirmation code is: ${code}`);
        
        // Notify parent component
        if (onBookingSuccess) {
          onBookingSuccess(response.booking);
        }
        
        // Auto-close modal after 3 seconds
        setTimeout(() => {
          if (onClose) {
            onClose();
          }
        }, 3000);
        
      } else {
        setError(response.message || 'Booking created but no booking data returned');
      }
    } catch (err) {
      console.error('Booking error:', err);
      
      let errorMessage = 'Failed to create booking. Please try again.';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Generate next 14 days for date selection
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        })
      });
    }
    return dates;
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div 
            className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto dark:bg-gray-800"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.3, stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center">
            <span className="text-2xl mr-3">{getBusinessIcon(business.type)}</span>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Book Appointment</h2>
              <p className="text-gray-600 dark:text-gray-300">{business.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl dark:text-gray-500 dark:hover:text-gray-300"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded dark:bg-red-900 dark:border-red-600 dark:text-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded dark:bg-green-900 dark:border-green-600 dark:text-green-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400 dark:text-green-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{success}</p>
                  <p className="text-xs mt-1 text-green-600 dark:text-green-300">This modal will close automatically in a few seconds...</p>
                </div>
              </div>
            </div>
          )}

          {/* Date Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
              Select Date
            </label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400"
              required
            >
              <option value="">Choose a date</option>
              {getAvailableDates().map((date) => (
                <option key={date.value} value={date.value}>
                  {date.label}
                </option>
              ))}
            </select>
          </div>

          {/* Time Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
              Select Time
            </label>
            {selectedDate ? (
              availableSlots.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => setSelectedTime(slot.time)}
                      className={`px-3 py-2 text-sm rounded-md border ${
                        selectedTime === slot.time
                          ? 'bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-blue-900'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm dark:text-gray-400">No available slots for this date</p>
              )
            ) : (
              <p className="text-gray-500 text-sm dark:text-gray-400">Please select a date first</p>
            )}
          </div>

          {/* Customer Information */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 dark:text-white">Customer Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-400"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-400"
                  placeholder="Enter your phone number"
                  required
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-400"
                placeholder="Enter your email address"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
              Additional Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-400"
              placeholder="Any special requests or notes..."
            />
          </div>

          {/* Payment Method */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
              Payment Method
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mr-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="text-sm dark:text-gray-300">💰 Cash (Pay at venue)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="online"
                  checked={paymentMethod === 'online'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mr-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="text-sm dark:text-gray-300">💳 Online Payment (2% discount)</span>
              </label>
            </div>
          </div>

          {/* Booking Summary */}
          {selectedDate && selectedTime && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
              <h3 className="font-medium text-gray-900 mb-2 dark:text-white">Booking Summary</h3>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <p><span className="font-medium">Business:</span> {business.name}</p>
                <p><span className="font-medium">Date:</span> {new Date(selectedDate).toLocaleDateString()}</p>
                <p><span className="font-medium">Time:</span> {selectedTime}</p>
                <p><span className="font-medium">Payment:</span> {paymentMethod === 'cash' ? 'Cash at venue' : 'Online (2% discount)'}</p>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              {success ? 'Close' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading || success || !selectedDate || !selectedTime}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {success ? '✓ Booking Confirmed' : loading ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BookingModal;
