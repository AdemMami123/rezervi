import React, { useState } from 'react';
import { motion } from 'framer-motion';
import API from '../utils/api';

const BusinessSettings = ({ settings = {}, onSettingsUpdate }) => {
  const [formData, setFormData] = useState({
    slot_duration_minutes: settings.slot_duration_minutes || 30,
    online_payment_enabled: settings.online_payment_enabled || false,
    accept_walkins: settings.accept_walkins || false,
    max_simultaneous_bookings: settings.max_simultaneous_bookings || 1,
    working_hours_json: settings.working_hours_json || [
      { day: 'monday', enabled: false, open: '09:00', close: '17:00' },
      { day: 'tuesday', enabled: false, open: '09:00', close: '17:00' },
      { day: 'wednesday', enabled: false, open: '09:00', close: '17:00' },
      { day: 'thursday', enabled: false, open: '09:00', close: '17:00' },
      { day: 'friday', enabled: false, open: '09:00', close: '17:00' },
      { day: 'saturday', enabled: false, open: '09:00', close: '17:00' },
      { day: 'sunday', enabled: false, open: '09:00', close: '17:00' }
    ]
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const daysOfWeek = [
    { value: 'monday', label: 'Monday', emoji: '📅' },
    { value: 'tuesday', label: 'Tuesday', emoji: '📅' },
    { value: 'wednesday', label: 'Wednesday', emoji: '📅' },
    { value: 'thursday', label: 'Thursday', emoji: '📅' },
    { value: 'friday', label: 'Friday', emoji: '📅' },
    { value: 'saturday', label: 'Saturday', emoji: '🎉' },
    { value: 'sunday', label: 'Sunday', emoji: '🎉' }
  ];

  const slotDurations = [
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' }
  ];

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleWorkingHoursChange = (dayIndex, field, value) => {
    const updatedHours = [...formData.working_hours_json];
    updatedHours[dayIndex] = {
      ...updatedHours[dayIndex],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      working_hours_json: updatedHours
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await API.put('/api/business/settings', formData);
      setMessage('Settings updated successfully!');
      if (onSettingsUpdate) {
        onSettingsUpdate();
      }
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Business Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Configure your business operations and preferences
        </p>
      </div>

      {/* Message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 p-4 rounded-xl ${
            message.includes('success') 
              ? 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400' 
              : 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400'
          }`}
        >
          {message}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* General Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
        >
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            ⚙️ General Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Slot Duration */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Appointment Duration
              </label>
              <select
                value={formData.slot_duration_minutes}
                onChange={(e) => handleInputChange('slot_duration_minutes', parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {slotDurations.map(duration => (
                  <option key={duration.value} value={duration.value}>
                    {duration.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Max Simultaneous Bookings */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Max Simultaneous Bookings
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.max_simultaneous_bookings}
                onChange={(e) => handleInputChange('max_simultaneous_bookings', parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Feature Toggles */}
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">💳 Online Payment</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Allow customers to pay online</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.online_payment_enabled}
                  onChange={(e) => handleInputChange('online_payment_enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">🚶 Walk-ins</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Accept walk-in customers</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.accept_walkins}
                  onChange={(e) => handleInputChange('accept_walkins', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </motion.div>

        {/* Working Hours */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
        >
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            🕐 Working Hours
          </h3>
          
          <div className="space-y-4">
            {daysOfWeek.map((day, index) => (
              <motion.div
                key={day.value}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
              >
                {/* Day Toggle */}
                <div className="flex items-center space-x-3 w-32">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.working_hours_json[index].enabled}
                      onChange={(e) => handleWorkingHoursChange(index, 'enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {day.emoji} {day.label}
                  </span>
                </div>

                {/* Time Inputs */}
                {formData.working_hours_json[index].enabled ? (
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-600 dark:text-gray-400">From:</label>
                      <input
                        type="time"
                        value={formData.working_hours_json[index].open}
                        onChange={(e) => handleWorkingHoursChange(index, 'open', e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-600 dark:text-gray-400">To:</label>
                      <input
                        type="time"
                        value={formData.working_hours_json[index].close}
                        onChange={(e) => handleWorkingHoursChange(index, 'close', e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 text-sm text-gray-500 dark:text-gray-400">
                    Closed
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-end"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '💾 Saving...' : '💾 Save Settings'}
          </motion.button>
        </motion.div>
      </form>
    </div>
  );
};

export default BusinessSettings;