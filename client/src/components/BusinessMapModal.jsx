import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const BusinessMapModal = ({ isOpen, onClose, businesses, onBusinessSelect, userLocation = null }) => {
  // Default center (Tunis, Tunisia)
  const defaultCenter = [36.8065, 10.1815];
  const mapCenter = userLocation ? [userLocation.lat, userLocation.lng] : defaultCenter;

  // Create custom icons for different business types
  const createBusinessIcon = (type) => {
    const iconColors = {
      barbershop: '#EF4444',
      beauty_salon: '#EC4899',
      restaurant: '#F59E0B',
      cafe: '#6B7280',
      football_field: '#10B981',
      tennis_court: '#06B6D4',
      gym: '#8B5CF6',
      car_wash: '#3B82F6',
      spa: '#F97316',
      dentist: '#14B8A6',
      doctor: '#059669',
      other: '#6B7280'
    };
    
    const color = iconColors[type] || '#6B7280';
    
    return new L.Icon({
      iconUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="30" height="30">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      `)}`,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -30]
    });
  };

  // Create user location icon
  const userIcon = new L.Icon({
    iconUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#4F46E5" width="24" height="24">
        <circle cx="12" cy="12" r="6" fill="#4F46E5"/>
        <circle cx="12" cy="12" r="3" fill="white"/>
      </svg>
    `)}`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });

  // Get business type display label
  const getBusinessTypeLabel = (type) => {
    const types = {
      barbershop: 'Barbershop',
      beauty_salon: 'Beauty Salon',
      restaurant: 'Restaurant',
      cafe: 'Café',
      football_field: 'Football Field',
      tennis_court: 'Tennis Court',
      gym: 'Gym',
      car_wash: 'Car Wash',
      spa: 'Spa & Wellness',
      dentist: 'Dentist',
      doctor: 'Doctor',
      other: 'Other'
    };
    return types[type] || type.replace('_', ' ');
  };

  // Get business type icon
  const getBusinessTypeIcon = (type) => {
    const icons = {
      barbershop: '💇‍♂️',
      beauty_salon: '💄',
      restaurant: '🍽️',
      cafe: '☕',
      football_field: '⚽',
      tennis_court: '🎾',
      gym: '🏋️‍♂️',
      car_wash: '🚗',
      spa: '🧘‍♀️',
      dentist: '🦷',
      doctor: '👩‍⚕️',
      other: '🏢'
    };
    return icons[type] || '📍';
  };

  // Handle business selection
  const handleBusinessSelect = (business) => {
    if (onBusinessSelect) {
      onBusinessSelect(business);
    }
    onClose(); // Close the modal after selecting a business
  };

  // Close modal when clicking outside
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
        onClick={handleOverlayClick}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                🗺️ Business Locations
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {businesses.filter(b => b.latitude && b.longitude).length} businesses found with location data
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Map Container */}
          <div className="p-4">
            <div className="w-full h-[70vh] rounded-xl border border-gray-300 dark:border-gray-600 overflow-hidden shadow-lg">
              <MapContainer
                center={mapCenter}
                zoom={userLocation ? 12 : 10}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* User location marker */}
                {userLocation && (
                  <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                    <Popup>
                      <div className="text-center p-2">
                        <div className="font-bold text-blue-600 mb-1">📍 Your Location</div>
                        <div className="text-sm text-gray-600">
                          {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Business markers */}
                {businesses
                  .filter(business => business.latitude && business.longitude)
                  .map(business => (
                    <Marker
                      key={business.id}
                      position={[business.latitude, business.longitude]}
                      icon={createBusinessIcon(business.type)}
                    >
                      <Popup>
                        <div className="p-3 min-w-[250px]">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">{getBusinessTypeIcon(business.type)}</span>
                            <h3 className="font-bold text-lg text-gray-900">{business.name}</h3>
                          </div>
                          
                          <div className="space-y-1 mb-3">
                            <p className="text-gray-600 text-sm flex items-center gap-1">
                              <span>🏷️</span>
                              {getBusinessTypeLabel(business.type)}
                            </p>
                            <p className="text-gray-500 text-sm flex items-center gap-1">
                              <span>📍</span>
                              {business.location}
                            </p>
                            {business.phone && (
                              <p className="text-gray-500 text-sm flex items-center gap-1">
                                <span>📞</span>
                                {business.phone}
                              </p>
                            )}
                            {business.rating && (
                              <p className="text-gray-500 text-sm flex items-center gap-1">
                                <span>⭐</span>
                                {business.rating}/5
                              </p>
                            )}
                          </div>
                          
                          <button 
                            onClick={() => handleBusinessSelect(business)}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                          >
                            🎯 View Details & Book
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
              </MapContainer>
            </div>

            {/* Map Legend & Stats */}
            <div className="mt-4 flex flex-wrap gap-4 justify-between items-center">
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <span>🗺️</span>
                  Map Legend
                </h4>
                <div className="flex flex-wrap gap-3 text-xs">
                  {userLocation && (
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-indigo-500 rounded-full mr-1"></div>
                      <span className="text-gray-600 dark:text-gray-400">Your Location</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                    <span className="text-gray-600 dark:text-gray-400">Businesses</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-700">
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                  💡 Click on any business marker to see details and book an appointment
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BusinessMapModal;