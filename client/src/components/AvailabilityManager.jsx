import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiClock, 
  FiCalendar, 
  FiUsers, 
  FiSave, 
  FiRefreshCw,
  FiToggleLeft,
  FiToggleRight 
} from 'react-icons/fi';
import API from '../utils/api';

const AvailabilityManager = ({ settings = {}, onSettingsUpdate }) => {
  const [availabilitySettings, setAvailabilitySettings] = useState({
    workingHours: {
      monday: { enabled: true, start: '09:00', end: '17:00' },
      tuesday: { enabled: true, start: '09:00', end: '17:00' },
      wednesday: { enabled: true, start: '09:00', end: '17:00' },
      thursday: { enabled: true, start: '09:00', end: '17:00' },
      friday: { enabled: true, start: '09:00', end: '17:00' },
      saturday: { enabled: false, start: '10:00', end: '15:00' },
      sunday: { enabled: false, start: '10:00', end: '15:00' }
    },
    appointmentSettings: {
      slotDuration: 60, // minutes
      bookingWindow: 30, // days in advance
      minAdvanceBooking: 2, // hours
      maxCapacityPerSlot: 1,
      bufferTimeBetweenBookings: 0 // minutes
    },
    specialDates: [],
    ...settings
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setAvailabilitySettings(prevState => ({
        ...prevState,
        ...settings
      }));
    }
  }, [settings]);

  const handleWorkingHoursChange = (day, field, value) => {
    setAvailabilitySettings(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours[day],
          [field]: value
        }
      }
    }));
  };

  const handleAppointmentSettingsChange = (field, value) => {
    setAvailabilitySettings(prev => ({
      ...prev,
      appointmentSettings: {
        ...prev.appointmentSettings,
        [field]: parseInt(value) || value
      }
    }));
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const response = await API.updateBusinessSettings({
        ...settings,
        ...availabilitySettings
      });
      
      if (response.success) {
        setMessage({ type: 'success', text: 'Availability settings saved successfully!' });
        if (onSettingsUpdate) {
          onSettingsUpdate();
        }
      } else {
        throw new Error(response.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving availability settings:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to save settings' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FiClock className="text-blue-600" />
            Availability Management
          </h2>
          <p className="text-gray-600 mt-1">Configure your business hours and appointment settings</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSaveSettings}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <FiRefreshCw className="animate-spin" />
          ) : (
            <FiSave />
          )}
          Save Settings
        </motion.button>
      </div>

      {/* Success/Error Message */}
      {message.text && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </motion.div>
      )}

      {/* Working Hours Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg p-6 border border-gray-200"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FiCalendar className="text-green-600" />
          Working Hours
        </h3>
        
        <div className="space-y-4">
          {daysOfWeek.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                {/* Day Name */}
                <div className="font-medium text-gray-900">{label}</div>
                
                {/* Toggle Switch */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleWorkingHoursChange(key, 'enabled', !availabilitySettings.workingHours[key].enabled)}
                    className={`p-1 rounded-full transition-colors ${
                      availabilitySettings.workingHours[key].enabled 
                        ? 'text-green-600 bg-green-100' 
                        : 'text-gray-400 bg-gray-100'
                    }`}
                  >
                    {availabilitySettings.workingHours[key].enabled ? (
                      <FiToggleRight size={24} />
                    ) : (
                      <FiToggleLeft size={24} />
                    )}
                  </button>
                  <span className={`text-sm ${
                    availabilitySettings.workingHours[key].enabled ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {availabilitySettings.workingHours[key].enabled ? 'Open' : 'Closed'}
                  </span>
                </div>
                
                {/* Start Time */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">From:</label>
                  <input
                    type="time"
                    value={availabilitySettings.workingHours[key].start}
                    onChange={(e) => handleWorkingHoursChange(key, 'start', e.target.value)}
                    disabled={!availabilitySettings.workingHours[key].enabled}
                    className="border border-gray-300 rounded px-3 py-1 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </div>
                
                {/* End Time */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">To:</label>
                  <input
                    type="time"
                    value={availabilitySettings.workingHours[key].end}
                    onChange={(e) => handleWorkingHoursChange(key, 'end', e.target.value)}
                    disabled={!availabilitySettings.workingHours[key].enabled}
                    className="border border-gray-300 rounded px-3 py-1 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Appointment Settings Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg p-6 border border-gray-200"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FiUsers className="text-purple-600" />
          Appointment Settings
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Slot Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Appointment Duration (minutes)
            </label>
            <select
              value={availabilitySettings.appointmentSettings.slotDuration}
              onChange={(e) => handleAppointmentSettingsChange('slotDuration', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
            </select>
          </div>

          {/* Max Capacity Per Slot */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Customers Per Slot
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={availabilitySettings.appointmentSettings.maxCapacityPerSlot}
              onChange={(e) => handleAppointmentSettingsChange('maxCapacityPerSlot', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Booking Window */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Booking Window (days in advance)
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={availabilitySettings.appointmentSettings.bookingWindow}
              onChange={(e) => handleAppointmentSettingsChange('bookingWindow', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Minimum Advance Booking */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Advance Booking (hours)
            </label>
            <select
              value={availabilitySettings.appointmentSettings.minAdvanceBooking}
              onChange={(e) => handleAppointmentSettingsChange('minAdvanceBooking', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>No minimum</option>
              <option value={1}>1 hour</option>
              <option value={2}>2 hours</option>
              <option value={4}>4 hours</option>
              <option value={12}>12 hours</option>
              <option value={24}>24 hours</option>
            </select>
          </div>

          {/* Buffer Time */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buffer Time Between Bookings (minutes)
            </label>
            <select
              value={availabilitySettings.appointmentSettings.bufferTimeBetweenBookings}
              onChange={(e) => handleAppointmentSettingsChange('bufferTimeBetweenBookings', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>No buffer time</option>
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
            </select>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AvailabilityManager;