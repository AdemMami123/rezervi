import React, { useState, useEffect, useRef } from 'react';
import API from '../utils/api';
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

const BusinessDiscovery = () => {
  const [businesses, setBusinesses] = useState([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [filters, setFilters] = useState({
    type: '',
    radius: 10, // km
    userLocation: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const businessTypes = [
    { value: '', label: 'All Types' },
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

  useEffect(() => {
    fetchBusinesses();
    getCurrentLocation();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [businesses, filters]);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const response = await API.get('/api/businesses/discover');
      setBusinesses(response.data);
    } catch (err) {
      setError('Failed to load businesses');
      console.error('Error fetching businesses:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFilters(prev => ({
            ...prev,
            userLocation: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const applyFilters = () => {
    let filtered = [...businesses];

    // Filter by type
    if (filters.type) {
      filtered = filtered.filter(business => business.type === filters.type);
    }

    // Filter by distance if user location is available
    if (filters.userLocation && filters.radius) {
      filtered = filtered.filter(business => {
        if (!business.latitude || !business.longitude) return true;
        
        const distance = calculateDistance(
          filters.userLocation.lat,
          filters.userLocation.lng,
          business.latitude,
          business.longitude
        );
        
        return distance <= filters.radius;
      });
    }

    // Sort by premium status first, then by distance
    filtered.sort((a, b) => {
      // First priority: premium businesses (Pro and Enterprise plans have premium listing)
      const aPremium = a.isPremium || false;
      const bPremium = b.isPremium || false;
      
      if (aPremium !== bPremium) {
        return bPremium ? 1 : -1; // Premium businesses first
      }

      // Second priority: distance (if user location is available)
      if (filters.userLocation && a.latitude && a.longitude && b.latitude && b.longitude) {
        const distanceA = calculateDistance(
          filters.userLocation.lat,
          filters.userLocation.lng,
          a.latitude,
          a.longitude
        );
        const distanceB = calculateDistance(
          filters.userLocation.lat,
          filters.userLocation.lng,
          b.latitude,
          b.longitude
        );
        return distanceA - distanceB;
      }

      // Default: alphabetical by name
      return a.name.localeCompare(b.name);
    });

    setFilteredBusinesses(filtered);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in kilometers
    return d;
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleBusinessSelect = (business) => {
    // Navigate to booking page for this business
    window.location.href = `/booking/${business.id}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading businesses...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Discover Businesses</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Find and book appointments at local businesses</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Business Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {businessTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Radius Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Distance (km)
                </label>
                <select
                  value={filters.radius}
                  onChange={(e) => handleFilterChange('radius', parseInt(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={5}>5 km</option>
                  <option value={10}>10 km</option>
                  <option value={20}>20 km</option>
                  <option value={50}>50 km</option>
                  <option value={100}>100 km</option>
                </select>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                List View
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'map'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Map View
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {viewMode === 'list' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBusinesses.map(business => (
              <BusinessCard
                key={business.id}
                business={business}
                userLocation={filters.userLocation}
                onSelect={() => handleBusinessSelect(business)}
              />
            ))}
          </div>
        ) : (
          <div className="h-96">
            <BusinessMapView
              businesses={filteredBusinesses}
              userLocation={filters.userLocation}
              onBusinessSelect={handleBusinessSelect}
            />
          </div>
        )}

        {filteredBusinesses.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No businesses found matching your criteria</div>
            <button
              onClick={() => setFilters({ type: '', radius: 10, userLocation: filters.userLocation })}
              className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Business Card Component
const BusinessCard = ({ business, userLocation, onSelect }) => {
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(false);

  const distance = userLocation && business.latitude && business.longitude
    ? calculateDistance(userLocation.lat, userLocation.lng, business.latitude, business.longitude)
    : null;

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  const checkAvailability = async () => {
    setLoading(true);
    try {
      const response = await API.get(`/api/businesses/${business.id}/availability?date=${new Date().toISOString().split('T')[0]}`);
      setAvailability(response.data);
    } catch (error) {
      console.error('Error checking availability:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    checkAvailability();
  }, [business.id]);

  const getBusinessTypeIcon = (type) => {
    const icons = {
      barbershop: '✂️',
      beauty_salon: '💄',
      restaurant: '🍽️',
      cafe: '☕',
      football_field: '⚽',
      tennis_court: '🎾',
      gym: '💪',
      car_wash: '🚗',
      spa: '🧖‍♀️',
      dentist: '🦷',
      doctor: '👩‍⚕️',
      other: '🏢'
    };
    return icons[type] || '🏢';
  };

  const getAvailabilityStatus = () => {
    if (loading) return { text: 'Checking...', color: 'text-gray-500' };
    if (!availability || availability.slots?.length === 0) return { text: 'Fully Booked', color: 'text-red-500' };
    if (availability.slots?.length > 0) return { text: `${availability.slots.length} slots available today`, color: 'text-green-500' };
    return { text: 'Check availability', color: 'text-gray-500' };
  };

  const availabilityStatus = getAvailabilityStatus();

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 border relative ${business.isPremium ? 'border-purple-300 ring-2 ring-purple-100' : 'border-gray-200'}`}>
      {/* Premium Badge */}
      {business.isPremium && (
        <div className="absolute top-3 right-3 z-10">
          <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg">
            ⭐ Premium
          </span>
        </div>
      )}
      
      {/* Business Photo */}
      {business.primary_photo && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={business.primary_photo}
            alt={business.name}
            className="w-full h-full object-cover"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>
      )}
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getBusinessTypeIcon(business.type)}</span>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{business.name}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {business.type.replace('_', ' ')}
                </span>
                {business.isPremium && (
                  <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                    💎 Featured
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {distance && (
            <div className="text-right">
              <span className="text-sm text-gray-500">
                {distance.toFixed(1)} km away
              </span>
            </div>
          )}
        </div>
        
        <p className="text-gray-600 mb-3 flex items-center">
          <span className="mr-2">📍</span>
          {business.location}
        </p>

        {/* Availability Status */}
        <div className="mb-4">
          <p className={`text-sm font-medium ${availabilityStatus.color}`}>
            {availabilityStatus.text}
          </p>
        </div>

        {/* Reviews Section */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-1">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-sm ${star <= 4 ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-sm text-gray-600 ml-1">4.2 (23 reviews)</span>
          </div>
          
          {/* Payment Options */}
          <div className="flex items-center space-x-2">
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
              💳 Online Pay
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onSelect}
          className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
        >
          Book Appointment
        </button>
      </div>
    </div>
  );
};

// Map View Component with Leaflet
const BusinessMapView = ({ businesses, userLocation, onBusinessSelect }) => {
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
      doctor: '#59C0D6',
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
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#4F46E5" width="20" height="20">
        <circle cx="12" cy="12" r="8"/>
      </svg>
    `)}`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
  });

  return (
    <div className="w-full">
      <div className="w-full h-96 rounded-lg border border-gray-300 overflow-hidden">
        <MapContainer
          center={mapCenter}
          zoom={12}
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
                <div className="text-center">
                  <strong>Your Location</strong>
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
                  <div className="p-2 min-w-[200px]">
                    <h3 className="font-semibold text-lg mb-1">{business.name}</h3>
                    <p className="text-gray-600 text-sm mb-1">
                      {business.type.replace('_', ' ')}
                    </p>
                    <p className="text-gray-500 text-xs mb-3">{business.location}</p>
                    <button 
                      onClick={() => onBusinessSelect(business)}
                      className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      Book Now
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>
      
      {/* Map Legend */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-sm text-gray-700 mb-2">Map Legend:</h4>
        <div className="flex flex-wrap gap-2 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
            <span>Your Location</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
            <span>Businesses</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          💡 Click on business markers to see details and book appointments
        </p>
      </div>
    </div>
  );
};

export default BusinessDiscovery;
