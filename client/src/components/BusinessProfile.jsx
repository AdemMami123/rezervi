import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import API from '../utils/api';
import LeafletMapPicker from './LeafletMapPicker';

// Fix for default markers in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const BusinessProfile = ({ business, onBusinessUpdate }) => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [originalData, setOriginalData] = useState({});
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [errors, setErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data when business changes
  useEffect(() => {
    if (business) {
      const initialData = {
        name: business.name || '',
        type: business.type || '',
        location: business.location || '',
        phone: business.phone || '',
        description: business.description || '',
        latitude: business.latitude || '',
        longitude: business.longitude || ''
      };
      setFormData(initialData);
      setOriginalData(initialData);
    }
  }, [business]);

  // Check for changes
  useEffect(() => {
    const changed = Object.keys(formData).some(key => formData[key] !== originalData[key]);
    setHasChanges(changed);
  }, [formData, originalData]);

  const businessTypes = [
    { value: 'barbershop', label: '💇 Barbershop', icon: '💇' },
    { value: 'beauty_salon', label: '💄 Beauty Salon', icon: '💄' },
    { value: 'restaurant', label: '🍽️ Restaurant', icon: '🍽️' },
    { value: 'cafe', label: '☕ Café', icon: '☕' },
    { value: 'football_field', label: '⚽ Football Field', icon: '⚽' },
    { value: 'tennis_court', label: '🎾 Tennis Court', icon: '🎾' },
    { value: 'gym', label: '💪 Gym', icon: '💪' },
    { value: 'car_wash', label: '🚗 Car Wash', icon: '🚗' },
    { value: 'spa', label: '🧘 Spa & Wellness', icon: '🧘' },
    { value: 'dentist', label: '🦷 Dentist', icon: '🦷' },
    { value: 'doctor', label: '👩‍⚕️ Doctor', icon: '👩‍⚕️' },
    { value: 'other', label: '🏢 Other', icon: '🏢' }
  ];

  const showNotification = (message, type = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 4000);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name?.trim()) newErrors.name = 'Business name is required';
    if (!formData.type) newErrors.type = 'Business type is required';
    if (!formData.location?.trim()) newErrors.location = 'Location is required';
    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleLocationSelect = (locationData) => {
    setFormData(prev => ({
      ...prev,
      latitude: locationData.lat,
      longitude: locationData.lng,
      location: locationData.address || prev.location
    }));
  };

  const handleSave = async () => {
    if (!validateForm()) {
      showNotification('Please fix the errors below', 'error');
      return;
    }

    setLoading(true);
    try {
      await API.put('/api/business/update', formData);
      setOriginalData({ ...formData });
      setEditMode(false);
      showNotification('Business details updated successfully!', 'success');
      if (onBusinessUpdate) onBusinessUpdate();
    } catch (error) {
      showNotification(error.response?.data?.error || 'Failed to update business details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ ...originalData });
    setErrors({});
    setEditMode(false);
  };

  const enterEditMode = () => {
    setEditMode(true);
    setErrors({});
  };

  const getBusinessTypeIcon = (type) => {
    const businessType = businessTypes.find(bt => bt.value === type);
    return businessType ? businessType.icon : '🏢';
  };

  const getBusinessTypeLabel = (type) => {
    const businessType = businessTypes.find(bt => bt.value === type);
    return businessType ? businessType.label.replace(/^.+?\s/, '') : type?.replace('_', ' ') || 'Not specified';
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Business Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {editMode ? 'Update your business information' : 'Manage your business details'}
          </p>
        </div>

        {/* Action Button */}
        <AnimatePresence mode="wait">
          {!editMode ? (
            <motion.button
              key="edit-button"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
              whileTap={{ scale: 0.95 }}
              onClick={enterEditMode}
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-8 py-4 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-3 group"
            >
              <span className="text-xl group-hover:rotate-12 transition-transform">✨</span>
              Edit Profile
            </motion.button>
          ) : (
            <div className="flex gap-3">
              <motion.button
                key="save-button"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                disabled={loading || !hasChanges}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    Save Changes
                  </>
                )}
              </motion.button>
              
              <motion.button
                key="cancel-button"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCancel}
                className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
              >
                <span>❌</span>
                Cancel
              </motion.button>
            </div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Notification */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className={`mb-6 p-4 rounded-2xl shadow-lg border-l-4 ${
              notification.type === 'success' 
                ? 'bg-green-50 border-green-500 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                : notification.type === 'error'
                ? 'bg-red-50 border-red-500 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                : 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">
                {notification.type === 'success' ? '✅' : notification.type === 'error' ? '⚠️' : 'ℹ️'}
              </span>
              {notification.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
      >
        {editMode ? (
          /* Edit Mode */
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Business Name */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <span className="text-lg">🏢</span>
                  Business Name *
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-5 py-4 border-2 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg ${
                    errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter your business name"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <span>⚠️</span> {errors.name}
                  </p>
                )}
              </motion.div>

              {/* Business Type */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <span className="text-lg">🎯</span>
                  Business Type *
                </label>
                <select
                  value={formData.type || ''}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className={`w-full px-5 py-4 border-2 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg ${
                    errors.type ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">Select business type</option>
                  {businessTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.type && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <span>⚠️</span> {errors.type}
                  </p>
                )}
              </motion.div>

              {/* Location */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <span className="text-lg">📍</span>
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className={`w-full px-5 py-4 border-2 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg ${
                    errors.location ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter your business location"
                />
                {errors.location && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <span>⚠️</span> {errors.location}
                  </p>
                )}
              </motion.div>

              {/* Phone */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <span className="text-lg">📞</span>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={`w-full px-5 py-4 border-2 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg ${
                    errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter phone number"
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <span>⚠️</span> {errors.phone}
                  </p>
                )}
              </motion.div>

              {/* Description */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="lg:col-span-2"
              >
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <span className="text-lg">📝</span>
                  Description
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-5 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  placeholder="Describe your business, services, and what makes you special..."
                />
              </motion.div>

              {/* Map Picker */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="lg:col-span-2"
              >
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <span className="text-lg">🗺️</span>
                  Business Location on Map
                </label>
                <div className="border-2 border-gray-300 dark:border-gray-600 rounded-2xl overflow-hidden shadow-lg">
                  <LeafletMapPicker
                    onLocationSelect={handleLocationSelect}
                    initialLocation={
                      formData.latitude && formData.longitude
                        ? { lat: parseFloat(formData.latitude), lng: parseFloat(formData.longitude) }
                        : null
                    }
                  />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                  <span>💡</span>
                  Click on the map to select your exact business location
                </p>
              </motion.div>

              {/* Coordinates Display */}
              {formData.latitude && formData.longitude && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 }}
                  className="lg:col-span-2"
                >
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-2xl border border-blue-200 dark:border-blue-700">
                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
                      <span>🎯</span>
                      Selected Coordinates
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-xl">
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Latitude</span>
                        <div className="font-mono text-lg font-semibold text-blue-600 dark:text-blue-400">
                          {parseFloat(formData.latitude).toFixed(6)}
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-xl">
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Longitude</span>
                        <div className="font-mono text-lg font-semibold text-purple-600 dark:text-purple-400">
                          {parseFloat(formData.longitude).toFixed(6)}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        ) : (
          /* View Mode */
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Business Info */}
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-2xl border border-blue-200 dark:border-blue-700"
                >
                  <label className="block text-sm font-semibold text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
                    <span className="text-lg">🏢</span>
                    Business Name
                  </label>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {business?.name || 'Not specified'}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-2xl border border-purple-200 dark:border-purple-700"
                >
                  <label className="block text-sm font-semibold text-purple-600 dark:text-purple-400 mb-3 flex items-center gap-2">
                    <span className="text-lg">🎯</span>
                    Business Type
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getBusinessTypeIcon(business?.type)}</span>
                    <span className="text-xl font-semibold text-gray-900 dark:text-white">
                      {getBusinessTypeLabel(business?.type)}
                    </span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-2xl border border-green-200 dark:border-green-700"
                >
                  <label className="block text-sm font-semibold text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
                    <span className="text-lg">📍</span>
                    Location
                  </label>
                  <div className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="text-xl">🏠</span>
                    {business?.location || 'Not specified'}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-6 rounded-2xl border border-orange-200 dark:border-orange-700"
                >
                  <label className="block text-sm font-semibold text-orange-600 dark:text-orange-400 mb-3 flex items-center gap-2">
                    <span className="text-lg">📞</span>
                    Phone Number
                  </label>
                  <div className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="text-xl">☎️</span>
                    {business?.phone || 'Not specified'}
                  </div>
                </motion.div>
              </div>

              {/* Description & Map */}
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 p-6 rounded-2xl border border-gray-200 dark:border-gray-700"
                >
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2">
                    <span className="text-lg">📝</span>
                    Description
                  </label>
                  <div className="text-gray-900 dark:text-white leading-relaxed">
                    {business?.description || 'No description provided'}
                  </div>
                </motion.div>

                {business?.latitude && business?.longitude && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 p-6 rounded-2xl border border-teal-200 dark:border-teal-700"
                  >
                    <label className="block text-sm font-semibold text-teal-600 dark:text-teal-400 mb-3 flex items-center gap-2">
                      <span className="text-lg">🗺️</span>
                      Business Location
                    </label>
                    <div className="rounded-2xl overflow-hidden border-2 border-teal-200 dark:border-teal-600 shadow-lg">
                      <div style={{ height: '250px', width: '100%' }}>
                        <MapContainer
                          center={[business.latitude, business.longitude]}
                          zoom={15}
                          scrollWheelZoom={false}
                          style={{ height: '100%', width: '100%' }}
                        >
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <Marker position={[business.latitude, business.longitude]}>
                            <Popup>
                              <div className="text-center p-2">
                                <div className="font-bold text-lg mb-1">{business.name}</div>
                                <div className="text-sm text-gray-600">{business.location}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {getBusinessTypeIcon(business.type)} {getBusinessTypeLabel(business.type)}
                                </div>
                              </div>
                            </Popup>
                          </Marker>
                        </MapContainer>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2 font-mono">
                      📍 Coordinates: {parseFloat(business.latitude).toFixed(6)}, {parseFloat(business.longitude).toFixed(6)}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default BusinessProfile;