import React, { useState } from 'react';
import { motion } from 'framer-motion';
import API from '../utils/api';

const BusinessProfile = ({ business, onBusinessUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: business?.name || '',
    type: business?.type || '',
    location: business?.location || '',
    phone: business?.phone || '',
    description: business?.description || '',
    latitude: business?.latitude || '',
    longitude: business?.longitude || ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const businessTypes = [
    { value: 'barbershop', label: 'Barbershop' },
    { value: 'beauty_salon', label: 'Beauty Salon' },
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'cafe', label: 'Café' },
    { value: 'football_field', label: 'Football Field' },
    { value: 'tennis_court', label: 'Tennis Court' },
    { value: 'gym', label: 'Gym' },
    { value: 'car_wash', label: 'Car Wash' },
    { value: 'spa', label: 'Spa & Wellness' },
    { value: 'dentist', label: 'Dentist' },
    { value: 'doctor', label: 'Doctor' },
    { value: 'other', label: 'Other' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await API.put('/api/business/update', formData);
      setMessage('Business updated successfully!');
      setIsEditing(false);
      if (onBusinessUpdate) {
        onBusinessUpdate();
      }
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to update business');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: business?.name || '',
      type: business?.type || '',
      location: business?.location || '',
      phone: business?.phone || '',
      description: business?.description || '',
      latitude: business?.latitude || '',
      longitude: business?.longitude || ''
    });
    setIsEditing(false);
    setMessage('');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Business Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your business information and settings
          </p>
        </div>
        {!isEditing && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsEditing(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            ✏️ Edit Profile
          </motion.button>
        )}
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

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
      >
        {!isEditing ? (
          /* View Mode */
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Business Info */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                    Business Name
                  </label>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {business?.name || 'Not specified'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                    Business Type
                  </label>
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 font-semibold capitalize">
                    {business?.type?.replace('_', ' ') || 'Not specified'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                    Location
                  </label>
                  <div className="text-gray-900 dark:text-white flex items-center">
                    📍 {business?.location || 'Not specified'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                    Phone Number
                  </label>
                  <div className="text-gray-900 dark:text-white flex items-center">
                    📞 {business?.phone || 'Not specified'}
                  </div>
                </div>
              </div>

              {/* Description & Coordinates */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                    Description
                  </label>
                  <div className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                    {business?.description || 'No description provided'}
                  </div>
                </div>

                {business?.latitude && business?.longitude && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                      Coordinates
                    </label>
                    <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                      <div>Latitude: {business.latitude}</div>
                      <div>Longitude: {business.longitude}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Business Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter business name"
                />
              </div>

              {/* Business Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Business Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select business type</option>
                  {businessTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter business location"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter phone number"
                />
              </div>

              {/* Latitude */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter latitude"
                />
              </div>

              {/* Longitude */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter longitude"
                />
              </div>
            </div>

            {/* Description */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Describe your business..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
              >
                {loading ? 'Saving...' : '💾 Save Changes'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleCancel}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                ❌ Cancel
              </motion.button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default BusinessProfile;