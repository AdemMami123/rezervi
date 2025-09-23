import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Component to handle map clicks
const LocationMarker = ({ position, setPosition, onLocationSelect }) => {
  const map = useMapEvents({
    click(e) {
      const newPosition = [e.latlng.lat, e.latlng.lng];
      setPosition(newPosition);
      
      // Reverse geocoding to get address (using Nominatim API)
      reverseGeocode(e.latlng.lat, e.latlng.lng, onLocationSelect);
    },
  });

  const reverseGeocode = async (lat, lng, callback) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      callback({
        lat,
        lng,
        address: data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      });
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      callback({
        lat,
        lng,
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      });
    }
  };

  return position === null ? null : (
    <Marker position={position}>
      <Popup>
        <div>
          <strong>Selected Location</strong><br />
          Lat: {position[0].toFixed(6)}<br />
          Lng: {position[1].toFixed(6)}
        </div>
      </Popup>
    </Marker>
  );
};

const LeafletMapPicker = ({ onLocationSelect, initialLocation = null }) => {
  const [position, setPosition] = useState(
    initialLocation ? [initialLocation.lat, initialLocation.lng] : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const mapRef = useRef();

  // Default center (Tunis, Tunisia)
  const defaultCenter = [36.8065, 10.1815];
  const mapCenter = position || (initialLocation ? [initialLocation.lat, initialLocation.lng] : defaultCenter);

  const handleLocationUpdate = (locationData) => {
    setPosition([locationData.lat, locationData.lng]);
    onLocationSelect(locationData);
  };

  // Search for places using Nominatim API
  const searchPlaces = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=tn`
      );
      const results = await response.json();
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.length > 2) {
        searchPlaces(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearchResultClick = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const newPosition = [lat, lng];
    
    setPosition(newPosition);
    setSearchResults([]);
    setSearchQuery(result.display_name);
    
    // Move map to the selected location
    if (mapRef.current) {
      mapRef.current.setView(newPosition, 15);
    }
    
    onLocationSelect({
      lat,
      lng,
      address: result.display_name
    });
  };

  return (
    <div className="w-full">
      {/* Search Input */}
      <div className="mb-4 relative">
        <input
          type="text"
          placeholder="Search for a location in Tunisia..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        
        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((result, index) => (
              <div
                key={index}
                onClick={() => handleSearchResultClick(result)}
                className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
              >
                <div className="font-medium text-sm text-gray-900">
                  {result.display_name}
                </div>
                <div className="text-xs text-gray-500">
                  {result.type} • {parseFloat(result.lat).toFixed(4)}, {parseFloat(result.lon).toFixed(4)}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {isSearching && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="w-full h-96 rounded-lg border border-gray-300 overflow-hidden">
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker
            position={position}
            setPosition={setPosition}
            onLocationSelect={handleLocationUpdate}
          />
        </MapContainer>
      </div>

      {/* Selected Location Info */}
      {position && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Selected Location:</strong><br />
            Latitude: {position[0].toFixed(6)}<br />
            Longitude: {position[1].toFixed(6)}
          </p>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-2 text-sm text-gray-500">
        <p>💡 Click on the map to select a location, or search above</p>
      </div>
    </div>
  );
};

export default LeafletMapPicker;
