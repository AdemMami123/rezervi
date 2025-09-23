import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true, // Crucial for sending cookies
});

API.interceptors.request.use((config) => {
  // With HttpOnly cookies, the browser automatically sends them.
  // No need to manually add Authorization header from localStorage.
  return config;
});

// Business availability function
export const getBusinessAvailability = async (businessId, date) => {
  try {
    const response = await API.get(`/api/businesses/${businessId}/availability`, {
      params: { date }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching business availability:', error);
    throw error;
  }
};

// Create booking function
export const createBooking = async (bookingData) => {
  try {
    const response = await API.post('/api/bookings', bookingData);
    return response.data;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};

export default API; 