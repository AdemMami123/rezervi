import React, { useState, useEffect } from 'react';

const BusinessCalendar = ({ reservations = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedReservations, setSelectedReservations] = useState([]);
  const [view, setView] = useState('month'); // 'month', 'week', 'day'
  const [actionLoading, setActionLoading] = useState(false);

  // Handle reservation actions
  const handleCallCustomer = (reservation) => {
    if (reservation.customer?.phone || reservation.phone) {
      const phone = reservation.customer?.phone || reservation.phone;
      window.open(`tel:${phone}`, '_self');
    } else {
      alert('No phone number available for this customer.');
    }
  };

  const handleEmailCustomer = (reservation) => {
    if (reservation.customer?.email || reservation.email) {
      const email = reservation.customer?.email || reservation.email;
      const customerName = reservation.customer?.name || reservation.name || 'Customer';
      const subject = encodeURIComponent(`Regarding your reservation on ${new Date(reservation.date_time || reservation.date).toLocaleDateString()}`);
      const body = encodeURIComponent(`Hello ${customerName},\n\nRegarding your reservation...\n\nBest regards`);
      window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_self');
    } else {
      alert('No email address available for this customer.');
    }
  };

  const handleEditReservation = (reservation) => {
    // TODO: Implement edit functionality
    console.log('Edit reservation:', reservation);
    alert('Edit functionality coming soon!');
  };

  const handleCancelReservation = async (reservation) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }

    setActionLoading(true);
    try {
      // TODO: Implement API call to cancel reservation
      console.log('Cancel reservation:', reservation);
      alert('Reservation cancelled successfully!');
      setShowDetailsModal(false);
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      alert('Failed to cancel reservation. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (reservation, newStatus) => {
    setActionLoading(true);
    try {
      // TODO: Implement API call to update status
      console.log('Update status:', reservation.id, newStatus);
      alert(`Status updated to ${newStatus} successfully!`);
      setShowDetailsModal(false);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Get current month/year
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Get first day of the month and number of days
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDay = firstDay.getDay(); // 0 = Sunday

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Day names
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get reservations for a specific date
  const getReservationsForDate = (date) => {
    const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    return reservations.filter(reservation => {
      const reservationDate = reservation.booking_date || reservation.reservation_date;
      return reservationDate === dateString;
    });
  };

  // Get today's date string for highlighting
  const today = new Date();
  const isToday = (date) => {
    return today.getDate() === date && 
           today.getMonth() === currentMonth && 
           today.getFullYear() === currentYear;
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600';
    }
  };

  // Format time
  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.slice(0, 5); // Remove seconds if present
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="p-2 h-32 bg-gray-50">
          <div className="text-gray-400 text-sm">
            {new Date(currentYear, currentMonth, 0 - (startingDay - 1 - i)).getDate()}
          </div>
        </div>
      );
    }

    // Add days of the current month
    for (let date = 1; date <= daysInMonth; date++) {
      const dayReservations = getReservationsForDate(date);
      const isCurrentDay = isToday(date);
      const isSelected = selectedDate === date;

      days.push(
        <div 
          key={date}
          className={`p-2 h-32 border cursor-pointer transition-colors dark:bg-gray-800 dark:border-gray-700 ${
            isCurrentDay ? 'bg-blue-50 border-blue-200 dark:bg-blue-900 dark:border-blue-700' : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
          } ${isSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''} hover:bg-gray-50 dark:hover:bg-gray-700`}
          onClick={() => {
            const dayReservations = getReservationsForDate(date);
            if (dayReservations.length > 0) {
              setSelectedReservations(dayReservations);
              setSelectedDate(date);
              setShowDetailsModal(true);
            } else {
              setSelectedDate(selectedDate === date ? null : date);
            }
          }}
        >
          <div className={`text-sm font-medium mb-1 ${
            isCurrentDay ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'
          }`}>
            {date}
          </div>
          
          <div className="space-y-1 overflow-hidden">
            {dayReservations.slice(0, 3).map((reservation, idx) => (
              <div 
                key={reservation.id || idx}
                className={`text-xs px-1 py-0.5 rounded border ${getStatusColor(reservation.payment_status || reservation.status)} cursor-pointer hover:opacity-80`}
                title={`Click to view details: ${reservation.customer_name} - ${formatTime(reservation.booking_time || reservation.reservation_time)}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedReservations([reservation]);
                  setSelectedDate(date);
                  setShowDetailsModal(true);
                }}
              >
                <div className="truncate">
                  {formatTime(reservation.booking_time || reservation.reservation_time)} {reservation.customer_name}
                </div>
              </div>
            ))}
            {dayReservations.length > 3 && (
              <div className="text-xs text-gray-500 px-1">
                +{dayReservations.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {monthNames[currentMonth]} {currentYear}
          </h3>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
          >
            Today
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-600 dark:text-gray-400"
          >
            ←
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded"
          >
            →
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-100 border border-green-200 rounded mr-1"></div>
          <span>Confirmed</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded mr-1"></div>
          <span>Pending</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded mr-1"></div>
          <span>Completed</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-100 border border-red-200 rounded mr-1"></div>
          <span>Cancelled</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-gray-50">
          {dayNames.map(day => (
            <div key={day} className="p-3 text-sm font-medium text-gray-700 text-center border-r border-gray-200 last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {generateCalendarDays()}
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">
            Reservations for {monthNames[currentMonth]} {selectedDate}, {currentYear}
          </h4>
          
          {getReservationsForDate(selectedDate).length === 0 ? (
            <p className="text-gray-500 text-sm">No reservations for this date.</p>
          ) : (
            <div className="space-y-3">
              {getReservationsForDate(selectedDate).map((reservation, idx) => (
                <div key={reservation.id || idx} className="bg-white p-3 rounded border">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">
                        {reservation.customer_name}
                      </div>
                      <div className="text-sm text-gray-600">
                        📞 {reservation.customer_phone}
                      </div>
                      {reservation.customer_email && (
                        <div className="text-sm text-gray-600">
                          ✉️ {reservation.customer_email}
                        </div>
                      )}
                      <div className="text-sm text-gray-600">
                        🕐 {formatTime(reservation.booking_time || reservation.reservation_time)}
                      </div>
                      {reservation.notes && (
                        <div className="text-sm text-gray-600 mt-1">
                          📝 {reservation.notes}
                        </div>
                      )}
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(reservation.payment_status || reservation.status)}`}>
                      {reservation.payment_status || reservation.status || 'pending'}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    Payment: {reservation.payment_method || 'not specified'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Detailed Reservation Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Reservations for {monthNames[currentMonth]} {selectedDate}, {currentYear}
              </h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedReservations([]);
                  setSelectedDate(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {selectedReservations.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No reservations for this date.
                </p>
              ) : (
                <div className="space-y-6">
                  {selectedReservations.map((reservation, idx) => (
                    <div key={reservation.id || idx} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                      {/* Reservation Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            {reservation.customer_name}
                          </h4>
                          <div className="text-lg text-blue-600 dark:text-blue-400 font-medium">
                            {formatTime(reservation.booking_time || reservation.reservation_time)}
                          </div>
                        </div>
                        <div className={`px-3 py-2 rounded-full text-sm font-medium ${getStatusColor(reservation.payment_status || reservation.status)}`}>
                          {(reservation.payment_status || reservation.status || 'pending').toUpperCase()}
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-3">
                          <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                            Contact Information
                          </h5>
                          <div className="space-y-2">
                            <div className="flex items-center text-gray-600 dark:text-gray-400">
                              <svg className="w-4 h-4 mr-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                              </svg>
                              <span className="font-medium">{reservation.customer_phone}</span>
                            </div>
                            {reservation.customer_email && (
                              <div className="flex items-center text-gray-600 dark:text-gray-400">
                                <svg className="w-4 h-4 mr-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                                </svg>
                                <span>{reservation.customer_email}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                            Booking Details
                          </h5>
                          <div className="space-y-2">
                            <div className="flex items-center text-gray-600 dark:text-gray-400">
                              <svg className="w-4 h-4 mr-3 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                              </svg>
                              <span>{reservation.booking_date || reservation.reservation_date}</span>
                            </div>
                            <div className="flex items-center text-gray-600 dark:text-gray-400">
                              <svg className="w-4 h-4 mr-3 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                              </svg>
                              <span className="capitalize">{reservation.payment_method || 'Not specified'}</span>
                            </div>
                            <div className="flex items-center text-gray-600 dark:text-gray-400">
                              <svg className="w-4 h-4 mr-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                              </svg>
                              <span>ID: {reservation.id}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Notes Section */}
                      {reservation.notes && (
                        <div className="mb-4">
                          <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
                            Special Notes
                          </h5>
                          <div className="bg-white dark:bg-gray-800 rounded-md p-3 border border-gray-200 dark:border-gray-600">
                            <p className="text-gray-700 dark:text-gray-300 italic">"{reservation.notes}"</p>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <button 
                          onClick={() => handleCallCustomer(reservation)}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          📞 Call Customer
                        </button>
                        {(reservation.customer_email || reservation.email) && (
                          <button 
                            onClick={() => handleEmailCustomer(reservation)}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            ✉️ Send Email
                          </button>
                        )}
                        <button 
                          onClick={() => handleEditReservation(reservation)}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ✏️ Edit Reservation
                        </button>
                        {(reservation.payment_status || reservation.status) !== 'cancelled' && (reservation.payment_status || reservation.status) !== 'completed' && (
                          <button 
                            onClick={() => handleCancelReservation(reservation)}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading ? 'Processing...' : '❌ Cancel'}
                          </button>
                        )}
                        {/* Status Update Buttons */}
                        {(reservation.payment_status || reservation.status) === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleUpdateStatus(reservation, 'confirmed')}
                              disabled={actionLoading}
                              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              ✅ Confirm
                            </button>
                          </>
                        )}
                        {(reservation.payment_status || reservation.status) === 'confirmed' && (
                          <button 
                            onClick={() => handleUpdateStatus(reservation, 'completed')}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            🏁 Mark Complete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessCalendar;
