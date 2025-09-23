import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BusinessCalendar = ({ reservations = [], business, onReservationUpdate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [view, setView] = useState('month'); // 'month', 'week', 'day'

  // Calendar navigation
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  // Get calendar data
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDateIter = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const dateStr = currentDateIter.toDateString();
      const dayReservations = reservations.filter(res => 
        new Date(res.date).toDateString() === dateStr
      );
      
      days.push({
        date: new Date(currentDateIter),
        dateStr,
        isCurrentMonth: currentDateIter.getMonth() === month,
        isToday: currentDateIter.toDateString() === new Date().toDateString(),
        reservations: dayReservations,
        reservationCount: dayReservations.length
      });
      
      currentDateIter.setDate(currentDateIter.getDate() + 1);
    }
    
    return days;
  }, [currentDate, reservations]);

  // Get week data for week view
  const weekData = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = date.toDateString();
      
      days.push({
        date,
        dateStr,
        reservations: reservations.filter(res => 
          new Date(res.date).toDateString() === dateStr
        )
      });
    }
    
    return days;
  }, [currentDate, reservations]);

  // Get day reservations for day view
  const dayReservations = useMemo(() => {
    const dateStr = currentDate.toDateString();
    return reservations.filter(res => 
      new Date(res.date).toDateString() === dateStr
    ).sort((a, b) => a.time.localeCompare(b.time));
  }, [currentDate, reservations]);

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500',
      confirmed: 'bg-green-500',
      completed: 'bg-blue-500',
      cancelled: 'bg-red-500'
    };
    return colors[status] || colors.pending;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Business Calendar
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View and manage your appointments schedule
        </p>
      </div>

      {/* Calendar Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50 mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          {/* View Toggle */}
          <div className="flex space-x-2">
            {['month', 'week', 'day'].map((viewType) => (
              <button
                key={viewType}
                onClick={() => setView(viewType)}
                className={`px-4 py-2 rounded-lg font-semibold capitalize transition-all ${
                  view === viewType
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {viewType}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => view === 'month' ? navigateMonth(-1) : navigateWeek(-1)}
              className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              ←
            </button>
            
            <h2 className="text-xl font-bold text-gray-900 dark:text-white min-w-[200px] text-center">
              {view === 'day' 
                ? currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                : `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              }
            </h2>
            
            <button
              onClick={() => view === 'month' ? navigateMonth(1) : navigateWeek(1)}
              className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              →
            </button>
          </div>

          {/* Today Button */}
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Today
          </button>
        </div>

        {/* Calendar Content */}
        <AnimatePresence mode="wait">
          {view === 'month' && (
            <motion.div
              key="month"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-7 gap-2"
            >
              {/* Day Headers */}
              {dayNames.map(day => (
                <div key={day} className="p-2 text-center font-semibold text-gray-600 dark:text-gray-400">
                  {day}
                </div>
              ))}
              
              {/* Calendar Days */}
              {calendarData.map((day, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.01 }}
                  onClick={() => setSelectedDate(day.date)}
                  className={`min-h-[100px] p-2 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    day.isCurrentMonth 
                      ? 'bg-white dark:bg-gray-800' 
                      : 'bg-gray-50 dark:bg-gray-900'
                  } ${
                    day.isToday ? 'ring-2 ring-blue-500' : ''
                  } ${
                    selectedDate?.toDateString() === day.dateStr ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className={`text-sm font-semibold mb-1 ${
                    day.isToday ? 'text-blue-600 dark:text-blue-400' : 
                    day.isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'
                  }`}>
                    {day.date.getDate()}
                  </div>
                  
                  {/* Reservations */}
                  <div className="space-y-1">
                    {day.reservations.slice(0, 3).map((reservation, idx) => (
                      <div
                        key={idx}
                        className={`text-xs px-2 py-1 rounded text-white truncate ${getStatusColor(reservation.status || 'pending')}`}
                      >
                        {reservation.time} {reservation.users?.full_name || reservation.customer_name}
                      </div>
                    ))}
                    {day.reservationCount > 3 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        +{day.reservationCount - 3} more
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {view === 'week' && (
            <motion.div
              key="week"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-7 gap-4"
            >
              {weekData.map((day, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="min-h-[400px] bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                >
                  <div className="text-center mb-4">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {dayNames[day.date.getDay()]}
                    </div>
                    <div className={`text-lg font-bold ${
                      day.date.toDateString() === new Date().toDateString() 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {day.date.getDate()}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {day.reservations.map((reservation, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded text-white text-sm ${getStatusColor(reservation.status || 'pending')}`}
                      >
                        <div className="font-semibold">{reservation.time}</div>
                        <div className="text-xs opacity-90">
                          {reservation.users?.full_name || reservation.customer_name}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {view === 'day' && (
            <motion.div
              key="day"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Appointments for {currentDate.toLocaleDateString()}
              </h3>
              
              {dayReservations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📅</div>
                  <div className="text-gray-500 dark:text-gray-400">
                    No appointments scheduled for this day
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {dayReservations.map((reservation, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className={`w-4 h-4 rounded-full ${getStatusColor(reservation.status || 'pending')}`}></div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {reservation.time} - {reservation.users?.full_name || reservation.customer_name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          📞 {reservation.customer_phone} 
                          {reservation.customer_email && ` • ✉️ ${reservation.customer_email}`}
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getStatusColor(reservation.status || 'pending')}`}>
                        {reservation.status || 'pending'}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default BusinessCalendar;