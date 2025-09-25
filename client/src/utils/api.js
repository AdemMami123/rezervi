import axios from 'axios';

// Dynamic base URL for development and production
const getBaseURL = () => {
  // In production, use environment variable if set
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }
  
  // In development, default to localhost
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5000';
  }
  
  // Fallback for production without env var (you'll need to deploy backend separately)
  return 'https://your-backend-url.com'; // Replace with your actual backend URL
};

const API = axios.create({
  baseURL: getBaseURL(),
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

// Reservation management functions
export const acceptReservation = async (reservationId) => {
  try {
    const response = await API.put(`/api/business/reservations/${reservationId}/accept`);
    return response.data;
  } catch (error) {
    console.error('Error accepting reservation:', error);
    throw error;
  }
};

export const declineReservation = async (reservationId, reason = '') => {
  try {
    const response = await API.put(`/api/business/reservations/${reservationId}/decline`, {
      reason
    });
    return response.data;
  } catch (error) {
    console.error('Error declining reservation:', error);
    throw error;
  }
};

export const updateReservationStatus = async (reservationId, status) => {
  try {
    const response = await API.put(`/api/business/reservations/${reservationId}`, {
      status
    });
    return response.data;
  } catch (error) {
    console.error('Error updating reservation status:', error);
    throw error;
  }
};

export const getReservationStats = async () => {
  try {
    const response = await API.get('/api/business/reservations/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching reservation stats:', error);
    throw error;
  }
};

// User booking management functions
export const rescheduleBooking = async (bookingId, newDate, newTime) => {
  try {
    const response = await API.put(`/api/user/bookings/${bookingId}`, {
      action: 'reschedule',
      date: newDate,
      time: newTime
    });
    return response.data;
  } catch (error) {
    console.error('Error rescheduling booking:', error);
    throw error;
  }
};

export const cancelBooking = async (bookingId, reason = '') => {
  try {
    const response = await API.put(`/api/user/bookings/${bookingId}`, {
      action: 'cancel',
      reason
    });
    return response.data;
  } catch (error) {
    console.error('Error canceling booking:', error);
    throw error;
  }
};

export const getBookingDetails = async (bookingId) => {
  try {
    const response = await API.get(`/api/user/bookings/${bookingId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching booking details:', error);
    throw error;
  }
};

export default API; 