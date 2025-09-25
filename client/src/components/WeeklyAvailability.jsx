import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiClock, FiToggleLeft, FiToggleRight } from 'react-icons/fi';

const WeeklyAvailability = ({ businessHours = null, onHoursChange, isEditing = false }) => {
  const defaultHours = useMemo(() => ({
    monday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
    tuesday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
    wednesday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
    thursday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
    friday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
    saturday: { isOpen: false, openTime: '09:00', closeTime: '17:00' },
    sunday: { isOpen: false, openTime: '09:00', closeTime: '17:00' }
  }), []);

  const [hours, setHours] = useState(defaultHours);
  const [isInitialized, setIsInitialized] = useState(false);

  const daysOfWeek = [
    { key: 'monday', label: 'Monday', shortLabel: 'Mon' },
    { key: 'tuesday', label: 'Tuesday', shortLabel: 'Tue' },
    { key: 'wednesday', label: 'Wednesday', shortLabel: 'Wed' },
    { key: 'thursday', label: 'Thursday', shortLabel: 'Thu' },
    { key: 'friday', label: 'Friday', shortLabel: 'Fri' },
    { key: 'saturday', label: 'Saturday', shortLabel: 'Sat' },
    { key: 'sunday', label: 'Sunday', shortLabel: 'Sun' }
  ];

  // Initialize hours from props - only once
  useEffect(() => {
    if (businessHours && !isInitialized) {
      try {
        const parsedHours = typeof businessHours === 'string' 
          ? JSON.parse(businessHours) 
          : businessHours;
        
        if (parsedHours && typeof parsedHours === 'object') {
          setHours(prevHours => ({
            ...prevHours,
            ...parsedHours
          }));
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('Error parsing business hours:', error);
        setIsInitialized(true);
      }
    } else if (!businessHours && !isInitialized) {
      setIsInitialized(true);
    }
  }, [businessHours, isInitialized]);

  // Debounced callback to notify parent of changes
  const debouncedOnHoursChange = useCallback(
    (newHours) => {
      if (onHoursChange && isEditing && isInitialized) {
        try {
          onHoursChange(newHours);
        } catch (error) {
          console.error('Error calling onHoursChange:', error);
        }
      }
    },
    [onHoursChange, isEditing, isInitialized]
  );

  // Notify parent component of changes with debouncing
  useEffect(() => {
    if (isInitialized) {
      const timeoutId = setTimeout(() => {
        debouncedOnHoursChange(hours);
      }, 300); // 300ms debounce
      
      return () => clearTimeout(timeoutId);
    }
  }, [hours, debouncedOnHoursChange, isInitialized]);

  const copyToAllDays = useCallback((day) => {
    if (!isEditing || !isInitialized) return;
    
    try {
      const dayHours = hours[day];
      if (!dayHours) return;

      const updatedHours = {};
      
      daysOfWeek.forEach(({ key }) => {
        updatedHours[key] = { ...dayHours };
      });
      
      setHours(updatedHours);
    } catch (error) {
      console.error('Error copying to all days:', error);
    }
  }, [isEditing, isInitialized, hours, daysOfWeek]);

  const toggleDay = useCallback((day) => {
    if (!isEditing || !isInitialized) return;
    
    try {
      setHours(prev => ({
        ...prev,
        [day]: {
          ...prev[day],
          isOpen: !prev[day].isOpen
        }
      }));
    } catch (error) {
      console.error('Error toggling day:', error);
    }
  }, [isEditing, isInitialized]);

  const updateTime = useCallback((day, timeType, value) => {
    if (!isEditing || !isInitialized) return;
    
    try {
      // Basic validation - ensure close time is after open time
      const currentDay = hours[day];
      if (!currentDay) return;

      const newHours = {
        ...currentDay,
        [timeType]: value
      };
      
      if (timeType === 'openTime' && newHours.closeTime && value >= newHours.closeTime) {
        // If open time is set after or equal to close time, automatically adjust close time
        const [openHour, openMinute] = value.split(':').map(Number);
        let closeHour = openHour + 1;
        let closeMinute = openMinute;
        
        // Handle hour overflow
        if (closeHour >= 24) {
          closeHour = 23;
          closeMinute = 59;
        }
        
        newHours.closeTime = `${closeHour.toString().padStart(2, '0')}:${closeMinute.toString().padStart(2, '0')}`;
      }
      
      if (timeType === 'closeTime' && newHours.openTime && value <= newHours.openTime) {
        // If close time is set before or equal to open time, automatically adjust open time
        const [closeHour, closeMinute] = value.split(':').map(Number);
        let openHour = closeHour - 1;
        let openMinute = closeMinute;
        
        // Handle hour underflow
        if (openHour < 0) {
          openHour = 0;
          openMinute = 0;
        }
        
        newHours.openTime = `${openHour.toString().padStart(2, '0')}:${openMinute.toString().padStart(2, '0')}`;
      }
      
      setHours(prev => ({
        ...prev,
        [day]: newHours
      }));
    } catch (error) {
      console.error('Error updating time:', error);
    }
  }, [isEditing, isInitialized, hours]);

  const formatTime = useCallback((time) => {
    try {
      if (!time) return '';
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return time || '';
    }
  }, []);

  // Don't render until initialized to prevent crashes
  if (!isInitialized) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg animate-pulse">
        <div className="flex items-center mb-4">
          <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded mr-2"></div>
          <div className="w-32 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
        <div className="space-y-3">
          {[1,2,3,4,5,6,7].map(i => (
            <div key={i} className="flex justify-between items-center py-2">
              <div className="w-20 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div className="w-16 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!isEditing) {
    // Check if any day is open
    const hasOpenDays = Object.values(hours).some(day => day.isOpen);
    
    // View mode - display business hours
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <FiClock className="text-blue-500 mr-2" size={20} />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Business Hours
            </h3>
          </div>
          {!hasOpenDays && (
            <span className="text-xs px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-full">
              Hours not set
            </span>
          )}
        </div>
        
        {!hasOpenDays && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center text-blue-700 dark:text-blue-300">
              <span className="text-lg mr-2">💡</span>
              <p className="text-sm font-medium">
                Set your business hours to let customers know when you're open!
              </p>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 ml-7">
              Go to Details → "Manage Hours" to set your availability
            </p>
          </div>
        )}
        
        <div className="space-y-3">
          {daysOfWeek.map(({ key, label }) => {
            const dayData = hours[key] || defaultHours[key];
            if (!dayData) return null; // Safety check
            
            return (
              <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                <span className="font-medium text-gray-900 dark:text-white">
                  {label}
                </span>
                {dayData.isOpen ? (
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    {formatTime(dayData.openTime)} - {formatTime(dayData.closeTime)}
                  </span>
                ) : (
                  <span className="text-gray-400 dark:text-gray-500">
                    Closed
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  // Edit mode - interactive form
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FiClock className="text-blue-500 mr-2" size={20} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Set Business Hours
          </h3>
        </div>
        <button
          onClick={() => {
            const mondayHours = hours.monday;
            copyToAllDays('monday');
          }}
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
        >
          Copy Monday to All
        </button>
      </div>
      
      <div className="space-y-4">
        {daysOfWeek.map(({ key, label, shortLabel }) => {
          const dayData = hours[key] || defaultHours[key];
          if (!dayData) return null; // Safety check
          
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: daysOfWeek.findIndex(d => d.key === key) * 0.1 }}
              className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              {/* Day toggle */}
              <div className="flex items-center space-x-3 w-32">
                <button
                  onClick={() => toggleDay(key)}
                  className="flex items-center space-x-2"
                >
                  {dayData.isOpen ? (
                    <FiToggleRight className="text-green-500" size={24} />
                  ) : (
                    <FiToggleLeft className="text-gray-400" size={24} />
                  )}
                </button>
                <span className="font-medium text-gray-900 dark:text-white text-sm">
                  {shortLabel}
                </span>
              </div>

              {/* Time inputs */}
              {dayData.isOpen ? (
                <div className="flex items-center space-x-3 flex-1">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Open
                    </label>
                    <input
                      type="time"
                      value={dayData.openTime || '09:00'}
                      onChange={(e) => updateTime(key, 'openTime', e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <span className="text-gray-400 dark:text-gray-500 text-sm">to</span>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Close
                    </label>
                    <input
                      type="time"
                      value={dayData.closeTime || '17:00'}
                      onChange={(e) => updateTime(key, 'closeTime', e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={() => copyToAllDays(key)}
                    className="px-3 py-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                  >
                    Copy to All
                  </button>
                </div>
              ) : (
                <div className="flex-1">
                  <span className="text-gray-400 dark:text-gray-500 text-sm">
                    Closed
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Tip:</strong> Use the toggle switches to open/close specific days. 
          Click "Copy to All" to apply the same hours to all days of the week.
        </p>
      </div>
    </motion.div>
  );
};

export default WeeklyAvailability;