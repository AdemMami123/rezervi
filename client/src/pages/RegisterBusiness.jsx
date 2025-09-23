import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import LeafletMapPicker from '../components/LeafletMapPicker';

function RegisterBusiness() {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [location, setLocation] = useState('');
  const [selectedMapLocation, setSelectedMapLocation] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const handleLocationSelect = (locationData) => {
    setSelectedMapLocation(locationData);
    if (locationData.address) {
      setLocation(locationData.address);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    
    if (!selectedMapLocation) {
      setError('Please select a location on the map');
      return;
    }
    
    try {
      const response = await API.post('/api/business/register', {
        name,
        type,
        location: location || 'Location from map',
        latitude: selectedMapLocation.lat,
        longitude: selectedMapLocation.lng,
      });
      setMessage(response.data.message);
      navigate('/'); 
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred during business registration.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-100 p-4">
      <div className="bg-white p-10 rounded-xl shadow-lg w-full max-w-4xl border border-gray-200">
        <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-8">Register Your Business</h2>
        {error && <p className="text-red-600 text-center mb-6 bg-red-100 p-3 rounded-md">{error}</p>}
        {message && <p className="text-green-600 text-center mb-6 bg-green-100 p-3 rounded-md">{message}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label htmlFor="name" className="block text-gray-700 text-sm font-semibold mb-2">Business Name:</label>
            <input
              type="text"
              id="name"
              className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="mb-5">
            <label htmlFor="type" className="block text-gray-700 text-sm font-semibold mb-2">Type (e.g., Barber, Restaurant, Football):</label>
            <select
              id="type"
              name="type"
              className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out"
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
            >
              <option value="">Select a business type</option>
              <option value="barber">Barber</option>
<option value="restaurant">Restaurant</option>
<option value="football">Football</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-semibold mb-2">Select Business Location:</label>
            <LeafletMapPicker 
              onLocationSelect={handleLocationSelect}
              initialLocation={selectedMapLocation}
            />
          </div>

          <div className="mb-5">
            <label htmlFor="location" className="block text-gray-700 text-sm font-semibold mb-2">Address (Optional - Auto-filled from map):</label>
            <input
              type="text"
              id="location"
              className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Address will be auto-filled when you select a location on the map"
            />
          </div>

          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline w-full transform transition duration-200 ease-in-out hover:scale-105"
          >
            Register Business
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegisterBusiness; 