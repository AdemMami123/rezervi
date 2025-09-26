import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import LeafletMapPicker from '../components/LeafletMapPicker';

function RegisterBusiness() {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [location, setLocation] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [selectedMapLocation, setSelectedMapLocation] = useState(null);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const businessTypes = [
    { value: '', label: 'Select a business type' },
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

  const handleLocationSelect = (locationData) => {
    setSelectedMapLocation(locationData);
    if (locationData.address) {
      setLocation(locationData.address);
    }
  };

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files);
    const maxFiles = 10;
    
    if (files.length > maxFiles) {
      setError(`You can only select up to ${maxFiles} photos`);
      return;
    }

    // Validate file types and sizes
    const validFiles = [];
    const previews = [];
    
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setError('Each image must be smaller than 5MB');
        return;
      }
      
      validFiles.push(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        previews.push({
          file,
          url: e.target.result,
          name: file.name
        });
        
        if (previews.length === validFiles.length) {
          setPhotoPreviews(previews);
        }
      };
      reader.readAsDataURL(file);
    }
    
    setSelectedPhotos(validFiles);
    setError(null);
  };

  const removePhoto = (index) => {
    const newPhotos = selectedPhotos.filter((_, i) => i !== index);
    const newPreviews = photoPreviews.filter((_, i) => i !== index);
    setSelectedPhotos(newPhotos);
    setPhotoPreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    
    // Validate required fields
    if (!name || name.trim() === '') {
      setError('Business name is required');
      setLoading(false);
      return;
    }

    if (!type || type === '') {
      setError('Please select a business type');
      setLoading(false);
      return;
    }

    if (!location || location.trim() === '') {
      setError('Location is required');
      setLoading(false);
      return;
    }
    
    if (!selectedMapLocation) {
      setError('Please select a location on the map');
      setLoading(false);
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('type', type);
      formData.append('location', location.trim() || 'Location from map');
      formData.append('latitude', selectedMapLocation.lat);
      formData.append('longitude', selectedMapLocation.lng);
      
      // Add social media URLs if provided
      if (instagramUrl && instagramUrl.trim()) {
        formData.append('instagram_url', instagramUrl.trim());
      }
      if (facebookUrl && facebookUrl.trim()) {
        formData.append('facebook_url', facebookUrl.trim());
      }
      
      // Add photos if any
      selectedPhotos.forEach((photo) => {
        formData.append('business_photos', photo);
      });
      
      console.log('Submitting business registration with type:', type);
      
      const response = await API.post('/api/business/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });      setMessage(`${response.data.message}${response.data.photoCount > 0 ? ` with ${response.data.photoCount} photo(s)` : ''}`);
      
      setTimeout(() => {
        navigate('/'); 
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred during business registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-100 p-4">
      <div className="bg-white p-6 sm:p-8 lg:p-10 rounded-xl shadow-lg w-full max-w-5xl border border-gray-200">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-gray-800 mb-6 sm:mb-8">Register Your Business</h2>
        {error && <p className="text-red-600 text-center mb-6 bg-red-100 p-3 rounded-md text-sm sm:text-base">{error}</p>}
        {message && <p className="text-green-600 text-center mb-6 bg-green-100 p-3 rounded-md text-sm sm:text-base">{message}</p>}
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Left Column */}
            <div>
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
                <label htmlFor="type" className="block text-gray-700 text-sm font-semibold mb-2">Business Type:</label>
                <select
                  id="type"
                  name="type"
                  className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  required
                >
                  {businessTypes.map((businessType) => (
                    <option key={businessType.value} value={businessType.value}>
                      {businessType.label}
                    </option>
                  ))}
                </select>
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

              {/* Social Media Section */}
              <div className="mb-5">
                <label htmlFor="instagramUrl" className="block text-gray-700 text-sm font-semibold mb-2">Instagram URL (Optional):</label>
                <input
                  type="url"
                  id="instagramUrl"
                  className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/yourbusiness"
                />
              </div>

              <div className="mb-5">
                <label htmlFor="facebookUrl" className="block text-gray-700 text-sm font-semibold mb-2">Facebook URL (Optional):</label>
                <input
                  type="url"
                  id="facebookUrl"
                  className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out"
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                  placeholder="https://facebook.com/yourbusiness"
                />
              </div>

              {/* Photo Upload Section */}
              <div className="mb-5">
                <label className="block text-gray-700 text-sm font-semibold mb-2">Business Photos (Optional):</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoSelect}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition duration-200"
                  >
                    📸 Select Photos
                  </button>
                  <p className="text-gray-500 text-sm mt-2">
                    Upload up to 10 photos of your business (max 5MB each)
                  </p>
                </div>
                
                {/* Photo Previews */}
                {photoPreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {photoPreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview.url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition duration-200"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Map */}
            <div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-semibold mb-2">Select Business Location:</label>
                <LeafletMapPicker 
                  onLocationSelect={handleLocationSelect}
                  initialLocation={selectedMapLocation}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg font-bold text-white transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:shadow-outline ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {loading ? 'Registering Business...' : 'Register Business'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegisterBusiness; 