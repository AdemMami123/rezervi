import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

const GoogleMapPicker = ({ onLocationSelect, initialLocation = null }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);

  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
        version: 'weekly',
        libraries: ['places']
      });

      try {
        const google = await loader.load();
        
        const mapOptions = {
          center: initialLocation || { lat: 36.8065, lng: 10.1815 }, // Default to Tunis
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        };

        const mapInstance = new google.maps.Map(mapRef.current, mapOptions);
        setMap(mapInstance);

        // Create marker
        const markerInstance = new google.maps.Marker({
          map: mapInstance,
          position: initialLocation || mapOptions.center,
          draggable: true,
          title: 'Business Location'
        });
        setMarker(markerInstance);

        // Handle marker drag
        markerInstance.addListener('dragend', () => {
          const position = markerInstance.getPosition();
          const location = {
            lat: position.lat(),
            lng: position.lng()
          };
          setSelectedLocation(location);
          onLocationSelect(location);
        });

        // Handle map click
        mapInstance.addListener('click', (event) => {
          const location = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          };
          markerInstance.setPosition(location);
          setSelectedLocation(location);
          onLocationSelect(location);
        });

        // Initialize Places Autocomplete
        const searchBox = document.getElementById('map-search');
        if (searchBox) {
          const autocomplete = new google.maps.places.Autocomplete(searchBox);
          autocomplete.bindTo('bounds', mapInstance);

          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            
            if (!place.geometry || !place.geometry.location) {
              return;
            }

            const location = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              address: place.formatted_address
            };

            mapInstance.setCenter(location);
            markerInstance.setPosition(location);
            setSelectedLocation(location);
            onLocationSelect(location);
          });
        }

      } catch (error) {
        console.error('Error loading Google Maps:', error);
      }
    };

    initMap();
  }, [initialLocation, onLocationSelect]);

  return (
    <div className="w-full">
      <div className="mb-4">
        <input
          id="map-search"
          type="text"
          placeholder="Search for a location..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      <div 
        ref={mapRef} 
        className="w-full h-96 rounded-lg border border-gray-300"
        style={{ minHeight: '400px' }}
      />
      
      {selectedLocation && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Selected Location:</strong><br />
            Latitude: {selectedLocation.lat?.toFixed(6)}<br />
            Longitude: {selectedLocation.lng?.toFixed(6)}
            {selectedLocation.address && (
              <>
                <br />Address: {selectedLocation.address}
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default GoogleMapPicker;
