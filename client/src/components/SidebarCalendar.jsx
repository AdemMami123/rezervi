import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns'; // This assumes date-fns is installed

const SidebarCalendar = ({ reservations = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth());
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedReservations, setSelectedReservations] = useState([]);

  useEffect(() => {
    setCurrentMonth(currentDate.getMonth());
    setCurrentYear(currentDate.getFullYear());
  }, [currentDate]);

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

  // Calendar data generation
  const generateCalendarData = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startingDay = firstDay.getDay(); // 0 = Sunday
    const daysInMonth = lastDay.getDate();
    
    const calendarData = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      calendarData.push({ 
        date: null, 
        day: new Date(currentYear, currentMonth, 0 - (startingDay - 1 - i)).getDate(),
        isPreviousMonth: true
      });
    }
    
    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Filter reservations for this day that are confirmed
      const confirmedReservations = reservations.filter(reservation => {
        const reservationDate = reservation.booking_date || reservation.reservation_date || reservation.date;
        return reservationDate === dateStr && 
               (reservation.payment_status === 'confirmed' || 
                reservation.status === 'confirmed');
      });
      
      calendarData.push({
        date,
        day,
        confirmedReservations,
        hasReservations: confirmedReservations.length > 0
      });
    }
    
    // Add empty cells for days after the last day of the month (to complete the grid)
    const remainingCells = 42 - calendarData.length; // 6 rows x 7 days = 42
    for (let i = 1; i <= remainingCells; i++) {
      calendarData.push({ 
        date: null, 
        day: i,
        isNextMonth: true
      });
    }
    
    return calendarData;
  };

  const calendarData = generateCalendarData();
  
  // Handle date click to show details
  const handleDateClick = (day) => {
    if (!day.date) return; // Don't do anything for empty cells
    
    if (day.confirmedReservations && day.confirmedReservations.length > 0) {
      setSelectedDate(day.date);
      setSelectedReservations(day.confirmedReservations);
      setShowDetailsModal(true);
    }
  };

  // Close the details modal
  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedReservations([]);
    setSelectedDate(null);
  };

  // Format time (from 24h to 12h)
  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Day names
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Check if a date is today
  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <button 
            onClick={goToPreviousMonth}
            className="text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400"
          >
            &lt;
          </button>
          <h2 className="text-gray-800 dark:text-gray-200 font-medium">
            {monthNames[currentMonth]} {currentYear}
          </h2>
          <button 
            onClick={goToNextMonth}
            className="text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400"
          >
            &gt;
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-xs text-center">
          {dayNames.map(day => (
            <div key={day} className="text-gray-500 dark:text-gray-400 font-medium py-1">
              {day[0]}
            </div>
          ))}
          
          {calendarData.map((day, index) => (
            <div 
              key={index} 
              onClick={() => handleDateClick(day)}
              className={`
                p-1 text-center rounded-md aspect-square flex flex-col items-center justify-center transition-colors
                ${day.isPreviousMonth || day.isNextMonth ? 
                  'text-gray-400 dark:text-gray-500' : 
                  'text-gray-700 dark:text-gray-200'}
                ${isToday(day.date) ? 
                  'bg-blue-100 dark:bg-blue-900 dark:text-blue-200' : ''}
                ${day.hasReservations ? 
                  'font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : 
                  ''}
              `}
            >
              {day.day}
              {day.hasReservations && (
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Booking Details Modal */}
      <AnimatePresence>
        {showDetailsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">
                  Bookings for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''}
                </h3>
                <button 
                  onClick={closeDetailsModal}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-4">
                {selectedReservations.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-6">
                    No confirmed bookings for this date.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {selectedReservations.map((reservation, index) => (
                      <div 
                        key={reservation.id} 
                        className="bg-white dark:bg-gray-700 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <div className="bg-green-100 dark:bg-green-800 p-2 rounded-full text-green-600 dark:text-green-200">
                              📅
                            </div>
                            <div className="ml-3">
                              <p className="font-medium text-gray-800 dark:text-gray-200">
                                {formatTime(reservation.time)}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Confirmed Booking
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3 text-sm">
                          <div className="flex items-start">
                            <div className="w-20 flex-shrink-0 text-gray-500 dark:text-gray-400">Customer:</div>
                            <div className="text-gray-800 dark:text-gray-200 font-medium">
                              {reservation.customer_name || reservation.users?.full_name || 'N/A'}
                            </div>
                          </div>
                          
                          <div className="flex items-start">
                            <div className="w-20 flex-shrink-0 text-gray-500 dark:text-gray-400">Phone:</div>
                            <div className="text-gray-800 dark:text-gray-200">
                              {reservation.customer_phone || 'N/A'}
                            </div>
                          </div>
                          
                          <div className="flex items-start">
                            <div className="w-20 flex-shrink-0 text-gray-500 dark:text-gray-400">Email:</div>
                            <div className="text-gray-800 dark:text-gray-200">
                              {reservation.customer_email || 'N/A'}
                            </div>
                          </div>
                          
                          {reservation.notes && (
                            <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-600">
                              <div className="text-gray-500 dark:text-gray-400 mb-1">Notes:</div>
                              <div className="text-gray-800 dark:text-gray-200 italic">
                                "{reservation.notes}"
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SidebarCalendar;