import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../utils/api';
import BusinessCard from '../components/BusinessCard';
import BusinessDetailModal from '../components/BusinessDetailModal';
import BookingModal from '../components/BookingModal';
import SearchFilters from '../components/SearchFilters';
import Pagination from '../components/Pagination';

function Home() {
  const [user, setUser] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const [userBookings, setUserBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState('discover'); // 'discover', 'bookings', 'profile'
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    type: '',
    location: '',
    rating: '',
    priceRange: ''
  });

  const navigate = useNavigate();
  const businessesPerPage = 12;

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [businesses, searchTerm, filters]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Fetch user data
      const userRes = await API.get('/auth/me');
      setUser(userRes.data);

      // Fetch all businesses
      const businessRes = await API.get('/api/businesses/discover');
      setBusinesses(businessRes.data);

      // Fetch user bookings if authenticated
      try {
        const bookingsRes = await API.get('/api/bookings/user');
        setUserBookings(bookingsRes.data);
      } catch (bookingErr) {
        // User might not have any bookings yet
        console.log('No bookings found or user not fully authenticated');
      }

    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...businesses];

    // Search term filter
    if (searchTerm) {
      filtered = filtered.filter(business => 
        business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (business.description && business.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Type filter
    if (filters.type) {
      filtered = filtered.filter(business => business.type === filters.type);
    }

    // Location filter (basic text search for now)
    if (filters.location) {
      filtered = filtered.filter(business => 
        business.location && business.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Rating filter
    if (filters.rating) {
      const minRating = parseFloat(filters.rating);
      filtered = filtered.filter(business => 
        business.rating && business.rating >= minRating
      );
    }

    setFilteredBusinesses(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleBusinessSelect = (business) => {
    setSelectedBusiness(business);
  };

  const handleBookNow = (business) => {
    setSelectedBusiness(business);
    setShowBookingModal(true);
  };

  const handleBookingSuccess = (newBooking) => {
    setUserBookings(prev => [...prev, newBooking]);
    setShowBookingModal(false);
    setSelectedBusiness(null);
    // Show success message
    alert('Booking confirmed successfully!');
  };

  const handleLogout = async () => {
    try {
      await API.post('/auth/logout');
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
      navigate('/login');
    }
  };

  // Pagination logic
  const indexOfLastBusiness = currentPage * businessesPerPage;
  const indexOfFirstBusiness = indexOfLastBusiness - businessesPerPage;
  const currentBusinesses = filteredBusinesses.slice(indexOfFirstBusiness, indexOfLastBusiness);
  const totalPages = Math.ceil(filteredBusinesses.length / businessesPerPage);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <p className="text-red-600 text-center mb-4">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Rezervi App</h1>
        <div className="flex items-center space-x-4">
          {userData && <span className="text-gray-700">Welcome, {userData.email}!</span>}
          {userBusiness ? (
            <Link to="/business-dashboard" className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105">
              Go to Dashboard
            </Link>
          ) : (
            <Link to="/register-business" className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105">
              Register Your Business
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="flex-grow flex items-center justify-center p-8 text-center">
        <div className="max-w-3xl">
          <h2 className="text-5xl font-extrabold text-gray-900 leading-tight mb-4">
            Your Ultimate Reservation Management Solution
          </h2>
          <p className="text-xl text-gray-700 mb-8">
            Effortlessly manage your bookings, appointments, and resources with our intuitive and powerful platform.
          </p>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105">
            Get Started
          </button>
        </div>
      </header>

      {/* Features Section (Placeholder) */}
      <section className="bg-white py-16 px-8">
        <div className="max-w-6xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-gray-800 mb-12">Key Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-lg shadow-md bg-gray-50">
              <h4 className="text-xl font-semibold text-gray-800 mb-3">Easy Booking</h4>
              <p className="text-gray-600">Streamline your booking process with a simple and efficient interface.</p>
            </div>
            <div className="p-6 rounded-lg shadow-md bg-gray-50">
              <h4 className="text-xl font-semibold text-gray-800 mb-3">Resource Management</h4>
              <p className="text-gray-600">Keep track of all your resources and their availability in one place.</p>
            </div>
            <div className="p-6 rounded-lg shadow-md bg-gray-50">
              <h4 className="text-xl font-semibold text-gray-800 mb-3">User Dashboard</h4>
              <p className="text-gray-600">Personalized dashboards for users to view and manage their reservations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white p-6 text-center">
        <p>&copy; {new Date().getFullYear()} Rezervi App. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Home; 