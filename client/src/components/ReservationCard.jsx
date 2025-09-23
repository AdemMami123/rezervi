import React from 'react';
import { motion } from 'framer-motion';

const ReservationCard = ({ reservation, onStatusUpdate }) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.slice(0, 5); // Remove seconds if present
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleStatusChange = (newStatus) => {
    if (onStatusUpdate) {
      onStatusUpdate(reservation.id, newStatus);
    }
  };

  const currentStatus = reservation.payment_status || reservation.status || 'pending';

  return (
    <motion.div 
      className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition-shadow dark:bg-gray-800 dark:border-gray-600 dark:hover:shadow-gray-700"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ 
        scale: 1.02, 
        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h5 className="font-semibold text-gray-900 dark:text-white">
              {reservation.customer_name || 'Unknown Customer'}
            </h5>
            <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(currentStatus)}`}>
              {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center">
              <span className="mr-2">📅</span>
              {formatDate(reservation.booking_date || reservation.reservation_date)}
            </div>
            <div className="flex items-center">
              <span className="mr-2">🕐</span>
              {formatTime(reservation.booking_time || reservation.reservation_time)}
            </div>
            <div className="flex items-center">
              <span className="mr-2">📞</span>
              {reservation.customer_phone || 'No phone'}
            </div>
            {reservation.customer_email && (
              <div className="flex items-center">
                <span className="mr-2">✉️</span>
                {reservation.customer_email}
              </div>
            )}
          </div>

          {reservation.notes && (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="mr-2">📝</span>
              <span className="italic">{reservation.notes}</span>
            </div>
          )}

          <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            Payment: {reservation.payment_method || 'Not specified'} • 
            ID: {reservation.id}
          </div>
        </div>
      </div>

      {/* Status Update Actions */}
      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        {currentStatus === 'pending' && (
          <>
            <button
              onClick={() => handleStatusChange('confirmed')}
              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
            >
              ✓ Confirm
            </button>
            <button
              onClick={() => handleStatusChange('cancelled')}
              className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
            >
              ✗ Cancel
            </button>
          </>
        )}
        
        {currentStatus === 'confirmed' && (
          <>
            <button
              onClick={() => handleStatusChange('completed')}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              ✓ Mark Complete
            </button>
            <button
              onClick={() => handleStatusChange('cancelled')}
              className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
            >
              ✗ Cancel
            </button>
          </>
        )}
        
        {currentStatus === 'completed' && (
          <span className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded dark:bg-gray-700 dark:text-gray-300">
            Service completed
          </span>
        )}
        
        {currentStatus === 'cancelled' && (
          <button
            onClick={() => handleStatusChange('confirmed')}
            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
          >
            ↻ Reactivate
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default ReservationCard;
