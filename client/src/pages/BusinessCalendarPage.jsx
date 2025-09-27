import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, isToday as isDateToday } from 'date-fns';
import API from '../utils/api';
import BookingDetailsModal from '../components/BookingDetailsModal';

const BusinessCalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth());
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear());
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedReservations, setSelectedReservations] = useState([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);

  // Fetch reservations when component mounts
  useEffect(() => {
    fetchReservations();
  }, []);

  // Update month and year when currentDate changes
  useEffect(() => {
    setCurrentMonth(currentDate.getMonth());
    setCurrentYear(currentDate.getFullYear());
  }, [currentDate]);

  const fetchReservations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await API.get('/api/business/reservations');
      const data = response.data?.reservations || response.data || [];
      setReservations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      setError('Failed to load reservations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Month navigation
  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Generate calendar data
  const generateCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday
    
    let calendarDays = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonthDate = new Date(currentYear, currentMonth, 0 - (startingDayOfWeek - i - 1));
      calendarDays.push({
        date: prevMonthDate,
        day: prevMonthDate.getDate(),
        isCurrentMonth: false,
        isPrevMonth: true
      });
    }
    
    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Filter reservations for this day
      const dayReservations = reservations.filter(reservation => {
        const reservationDate = reservation.booking_date || reservation.reservation_date || reservation.date;
        return reservationDate === dateStr;
      });
      
      const confirmedReservations = dayReservations.filter(res => 
        res.status === 'confirmed' || res.payment_status === 'confirmed'
      );
      
      calendarDays.push({
        date,
        day,
        isCurrentMonth: true,
        isToday: isToday(date),
        reservations: dayReservations,
        confirmedReservations: confirmedReservations,
        reservationCount: dayReservations.length,
        confirmedCount: confirmedReservations.length
      });
    }
    
    // Add empty cells for days after the last day of the month
    const remainingCells = 42 - calendarDays.length; // Always show 6 rows of 7 days
    for (let i = 1; i <= remainingCells; i++) {
      const nextMonthDate = new Date(currentYear, currentMonth + 1, i);
      calendarDays.push({
        date: nextMonthDate,
        day: nextMonthDate.getDate(),
        isCurrentMonth: false,
        isNextMonth: true
      });
    }
    
    return calendarDays;
  };

  const calendarDays = generateCalendarDays();

  // Check if a date is today using date-fns
  function isToday(date) {
    if (!date) return false;
    return isDateToday(date);
  }

  // Handle date click
  const handleDateClick = (day) => {
    if (!day.isCurrentMonth) return;
    
    setSelectedDate(day.date);
    setSelectedReservations(day.reservations || []);
    
    // Scroll to the reservations section
    setTimeout(() => {
      document.getElementById('selected-date-reservations')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Open booking detail modal
  const openBookingDetails = (bookingId) => {
    setSelectedBookingId(bookingId);
    setShowBookingModal(true);
  };

  // Month names for header
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Day names for header
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto p-4 md:p-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-4 md:mb-0">
              Business Calendar
            </h1>
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={goToToday}
                className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800"
              >
                Today
              </button>
              
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button 
                  onClick={goToPreviousMonth}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="px-2 font-medium">
                  {monthNames[currentMonth]} {currentYear}
                </span>
                <button 
                  onClick={goToNextMonth}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 p-4">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {/* Day Headers */}
                {dayNamesShort.map((day, index) => (
                  <div 
                    key={day} 
                    className="hidden md:flex h-10 items-center justify-center font-medium text-gray-500 dark:text-gray-400"
                  >
                    {dayNames[index]}
                  </div>
                ))}
                {dayNamesShort.map((day) => (
                  <div 
                    key={day} 
                    className="flex md:hidden h-10 items-center justify-center font-medium text-gray-500 dark:text-gray-400"
                  >
                    {day}
                  </div>
                ))}
                
                {/* Calendar Days */}
                {calendarDays.map((day, index) => (
                  <div 
                    key={index} 
                    onClick={() => handleDateClick(day)}
                    className={`
                      h-32 md:h-36 p-2 border rounded-lg relative overflow-hidden cursor-pointer transition-all 
                      ${day.isCurrentMonth 
                        ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' 
                        : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 opacity-50'}
                      ${day.isToday ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}
                      ${selectedDate && day.date && selectedDate.toDateString() === day.date.toDateString() 
                        ? 'ring-2 ring-purple-500 dark:ring-purple-400' : ''}
                      hover:shadow-md
                    `}
                  >
                    <div className="flex justify-between items-start">
                      <span 
                        className={`
                          text-sm font-medium inline-flex items-center justify-center h-6 w-6 rounded-full
                          ${day.isToday ? 'bg-blue-500 text-white' : 'text-gray-800 dark:text-gray-200'}
                        `}
                      >
                        {day.day}
                      </span>
                      {day.reservationCount > 0 && day.isCurrentMonth && (
                        <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded-full">
                          {day.reservationCount}
                        </span>
                      )}
                    </div>
                    
                    {/* Confirmed Reservation Indicators */}
                    {day.isCurrentMonth && day.confirmedCount > 0 && (
                      <div className="absolute top-9 left-0 right-0 flex justify-center">
                        <span className="h-1 w-1 bg-green-500 rounded-full mx-0.5"></span>
                      </div>
                    )}
                    
                    {/* Reservations List */}
                    {day.isCurrentMonth && day.reservations && day.reservations.length > 0 && (
                      <div className="mt-2 space-y-1 overflow-y-auto max-h-[80px]">
                        {day.reservations.slice(0, 3).map(reservation => (
                          <div 
                            key={reservation.id} 
                            onClick={(e) => {
                              e.stopPropagation();
                              openBookingDetails(reservation.id);
                            }}
                            className={`
                              text-xs p-1 rounded truncate cursor-pointer
                              ${reservation.status === 'confirmed' || reservation.payment_status === 'confirmed'
                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                : reservation.status === 'cancelled' || reservation.payment_status === 'cancelled'
                                  ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                                  : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                              }
                            `}
                          >
                            {(reservation.time || '').slice(0, 5)} - {reservation.customer_name || reservation.users?.full_name || 'Guest'}
                          </div>
                        ))}
                        {day.reservations.length > 3 && (
                          <div className="text-xs text-center text-gray-500 dark:text-gray-400">
                            +{day.reservations.length - 3} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Selected Date Reservations */}
        {selectedDate && (
          <div id="selected-date-reservations" className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                Reservations for {format(selectedDate, 'MMMM d, yyyy')}
              </h2>
              <button 
                onClick={() => setSelectedDate(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {selectedReservations.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No reservations for this date.
              </p>
            ) : (
              <div className="space-y-4">
                {selectedReservations.map(reservation => (
                  <motion.div
                    key={reservation.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`
                      bg-white dark:bg-gray-700 border rounded-lg shadow p-4
                      ${reservation.status === 'confirmed' || reservation.payment_status === 'confirmed'
                        ? 'border-green-200 dark:border-green-800'
                        : reservation.status === 'cancelled' || reservation.payment_status === 'cancelled'
                          ? 'border-red-200 dark:border-red-800'
                          : 'border-yellow-200 dark:border-yellow-800'
                      }
                    `}
                  >
                    <div className="flex flex-col md:flex-row justify-between">
                      <div className="flex items-center mb-3 md:mb-0">
                        <div className={`
                          h-10 w-10 rounded-full flex items-center justify-center mr-3
                          ${reservation.status === 'confirmed' || reservation.payment_status === 'confirmed'
                            ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300'
                            : reservation.status === 'cancelled' || reservation.payment_status === 'cancelled'
                              ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300'
                              : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300'
                          }
                        `}>
                          <span className="text-lg">
                            {reservation.status === 'confirmed' || reservation.payment_status === 'confirmed' ? '✓' : 
                             reservation.status === 'cancelled' || reservation.payment_status === 'cancelled' ? '✗' : '⌛'}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {reservation.customer_name || reservation.users?.full_name || 'Guest'}
                          </h3>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {reservation.time ? format(new Date(`2000-01-01T${reservation.time}`), 'h:mm a') : 'No time specified'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => openBookingDetails(reservation.id)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Phone</div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {reservation.customer_phone || 'Not provided'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Email</div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {reservation.customer_email || 'Not provided'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Status</div>
                        <div className="font-medium">
                          <span className={`
                            inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                            ${reservation.status === 'confirmed' || reservation.payment_status === 'confirmed'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : reservation.status === 'cancelled' || reservation.payment_status === 'cancelled'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }
                          `}>
                            {reservation.status || reservation.payment_status || 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {reservation.notes && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Notes</div>
                        <div className="text-sm text-gray-700 dark:text-gray-300 italic">
                          "{reservation.notes}"
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Booking Details Modal */}
      <BookingDetailsModal 
        isOpen={showBookingModal} 
        onClose={() => setShowBookingModal(false)}
        bookingId={selectedBookingId}
      />
    </div>
  );
};

export default BusinessCalendarPage;