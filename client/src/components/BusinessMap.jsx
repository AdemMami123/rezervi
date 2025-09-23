import React from 'react';
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

const BusinessMap = ({ 
  businesses = [], 
  userLocation = null, 
  onBusinessSelect,
  height = '400px',
  zoom = 12,
  showUserLocation = true 
}) => {
  // Default center (Tunis, Tunisia)
  const defaultCenter = [36.8065, 10.1815];
  const mapCenter = userLocation ? [userLocation.lat, userLocation.lng] : defaultCenter;

  // Create custom icons for different business types
  const createBusinessIcon = (type) => {
    const iconData = {
      barbershop: { color: '#EF4444', emoji: '✂️' },
      beauty_salon: { color: '#EC4899', emoji: '💄' },
      restaurant: { color: '#F59E0B', emoji: '🍽️' },
      cafe: { color: '#6B7280', emoji: '☕' },
      football_field: { color: '#10B981', emoji: '⚽' },
      tennis_court: { color: '#06B6D4', emoji: '🎾' },
      gym: { color: '#8B5CF6', emoji: '💪' },
      car_wash: { color: '#3B82F6', emoji: '🚗' },
      spa: { color: '#F97316', emoji: '🧖‍♀️' },
      dentist: { color: '#14B8A6', emoji: '🦷' },
      doctor: { color: '#59C0D6', emoji: '👩‍⚕️' },
      other: { color: '#6B7280', emoji: '🏢' }
    };
    
    const data = iconData[type] || iconData.other;
    
    return new L.DivIcon({
      html: `
        <div style="
          background-color: ${data.color};
          width: 35px;
          height: 35px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="
            transform: rotate(45deg);
            font-size: 16px;
            color: white;
          ">${data.emoji}</span>
        </div>
      `,
      className: 'custom-business-marker',
      iconSize: [35, 35],
      iconAnchor: [17, 35],
      popupAnchor: [0, -35]
    });
  };

  // Create user location icon
  const userIcon = new L.DivIcon({
    html: `
      <div style="
        background-color: #4F46E5;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        animation: pulse 2s infinite;
      "></div>
      <style>
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(79, 70, 229, 0); }
          100% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
        }
      </style>
    `,
    className: 'user-location-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
  });

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;
    return d;
  };

  return (
    <div className="w-full">
      <div 
        className="w-full rounded-lg border border-gray-300 overflow-hidden"
        style={{ height }}
      >
        <MapContainer
          center={mapCenter}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* User location marker */}
          {showUserLocation && userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
              <Popup>
                <div className="text-center p-1">
                  <div className="text-blue-600 text-lg mb-1">📍</div>
                  <strong className="text-sm">Your Location</strong>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Business markers */}
          {businesses
            .filter(business => business.latitude && business.longitude)
            .map(business => {
              const distance = userLocation ? 
                calculateDistance(
                  userLocation.lat, 
                  userLocation.lng, 
                  business.latitude, 
                  business.longitude
                ) : null;

              return (
                <Marker
                  key={business.id}
                  position={[business.latitude, business.longitude]}
                  icon={createBusinessIcon(business.type)}
                >
                  <Popup maxWidth={250}>
                    <div className="p-2">
                      <div className="flex items-center mb-2">
                        <span className="text-xl mr-2">
                          {business.type === 'barbershop' ? '✂️' : 
                           business.type === 'restaurant' ? '🍽️' : 
                           business.type === 'cafe' ? '☕' : 
                           business.type === 'football_field' ? '⚽' : 
                           business.type === 'gym' ? '💪' : '🏢'}
                        </span>
                        <h3 className="font-semibold text-lg text-gray-900">{business.name}</h3>
                      </div>
                      
                      <div className="mb-2">
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          {business.type.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-1 flex items-center">
                        <span className="mr-1">📍</span>
                        {business.location}
                      </p>
                      
                      {distance && (
                        <p className="text-gray-500 text-xs mb-2">
                          📏 {distance.toFixed(1)} km away
                        </p>
                      )}

                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <span className="text-yellow-400 mr-1">★</span>
                          <span className="text-xs text-gray-600">4.2 (23)</span>
                        </div>
                        <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          💳 Online Pay
                        </div>
                      </div>
                      
                      {onBusinessSelect && (
                        <button 
                          onClick={() => onBusinessSelect(business)}
                          className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors font-medium"
                        >
                          Book Appointment
                        </button>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
        </MapContainer>
      </div>
      
      {/* Map Stats */}
      <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <span>📍 {businesses.length} businesses found</span>
          {userLocation && <span>🎯 Location detected</span>}
        </div>
        <div className="text-xs">
          💡 Click markers for details
        </div>
      </div>
    </div>
  );
};

export default BusinessMap;
