import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../utils/api';
import BusinessDetailModal from '../components/BusinessDetailModal';
import BookingModal from '../components/BookingModal';
import BusinessCalendar from '../components/BusinessCalendar';
import ReservationCard from '../components/ReservationCard';
import { ThemeToggle } from '../contexts/ThemeContext';
import AnimatedLayout from '../components/AnimatedLayout';
import { motion } from 'framer-motion';

function Home() {
  const [user, setUser] = useState(null);
  const [userBusiness, setUserBusiness] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const [userBookings, setUserBookings] = useState([]);
  const [businessReservations, setBusinessReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState('discover'); // 'discover', 'bookings', 'profile', 'business'
  const [businessView, setBusinessView] = useState('overview'); // 'overview', 'calendar', 'reservations'
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showBusinessDetailModal, setShowBusinessDetailModal] = useState(false);
  const [showBusinessEditModal, setShowBusinessEditModal] = useState(false);
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

      // Fetch user's business if they own one
      try {
        const businessRes = await API.get('/api/business/user-business');
        if (businessRes.data.business) {
          setUserBusiness(businessRes.data.business);
          // If user owns a business, also fetch their reservations
          const reservationsRes = await API.get('/api/business/reservations');
          // Ensure businessReservations is always an array
          const reservations = reservationsRes.data?.reservations || reservationsRes.data || [];
          setBusinessReservations(Array.isArray(reservations) ? reservations : []);
        }
      } catch (businessErr) {
        // User doesn't own a business
        console.log('User does not own a business');
      }

      // Fetch all businesses
      const businessRes = await API.get('/api/businesses/discover');
      setBusinesses(businessRes.data);

      // Fetch user bookings if authenticated
      try {
        const bookingsRes = await API.get('/api/user/bookings');
        // Ensure userBookings is always an array
        setUserBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : 
                       bookingsRes.data?.bookings && Array.isArray(bookingsRes.data.bookings) ? bookingsRes.data.bookings : []);
      } catch (bookingErr) {
        // User might not have any bookings yet - ensure it's an empty array
        console.log('No bookings found or user not fully authenticated');
        setUserBookings([]);
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
    setShowBusinessDetailModal(true);
  };

  const handleBookNow = (business) => {
    setSelectedBusiness(business);
    setShowBookingModal(true);
  };

  const handleBookingSuccess = (newBooking) => {
    // Ensure userBookings is an array before spreading
    setUserBookings(prev => {
      const currentBookings = Array.isArray(prev) ? prev : [];
      return [...currentBookings, newBooking];
    });
    
    // If the booking is for the user's own business, refresh business reservations
    if (userBusiness && newBooking.business_id === userBusiness.id) {
      fetchBusinessReservations();
    }
    
    setShowBookingModal(false);
    setSelectedBusiness(null);
    // Success message is already shown by the BookingModal component
    console.log('Booking success handled in parent component');
  };

  const fetchBusinessReservations = async () => {
    if (!userBusiness) return;
    
    try {
      const reservationsRes = await API.get('/api/business/reservations');
      const reservations = reservationsRes.data?.reservations || reservationsRes.data || [];
      setBusinessReservations(Array.isArray(reservations) ? reservations : []);
    } catch (error) {
      console.error('Error fetching business reservations:', error);
    }
  };

  const handleBusinessUpdate = async (updatedBusiness) => {
    try {
      const response = await API.put('/api/business/update', updatedBusiness);
      setUserBusiness(response.data.business);
      setShowBusinessEditModal(false);
      alert('Business updated successfully!');
    } catch (err) {
      console.error('Error updating business:', err);
      alert('Failed to update business');
    }
  };

  const handleReservationStatusUpdate = async (reservationId, newStatus) => {
    try {
      await API.put(`/api/business/reservations/${reservationId}`, { payment_status: newStatus });
      setBusinessReservations(prev => {
        const currentReservations = Array.isArray(prev) ? prev : [];
        return currentReservations.map(res => 
          res.id === reservationId ? { ...res, payment_status: newStatus } : res
        );
      });
      alert('Reservation status updated!');
    } catch (err) {
      console.error('Error updating reservation:', err);
      alert('Failed to update reservation status');
    }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto dark:border-blue-400"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-600 text-lg dark:text-red-400">{error}</p>
          <button
            onClick={fetchInitialData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <AnimatedLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Rezervi</h1>
            </div>
            
            {/* Navigation */}
            <nav className="hidden md:flex space-x-8 items-center">
              <button
                onClick={() => setActiveSection('discover')}
                className={`${
                  activeSection === 'discover'
                    ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100'
                } px-3 py-2 text-sm font-medium`}
              >
                Discover Businesses
              </button>
              <button
                onClick={() => setActiveSection('bookings')}
                className={`${
                  activeSection === 'bookings'
                    ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100'
                } px-3 py-2 text-sm font-medium relative`}
              >
                My Bookings
                {userBookings.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center dark:bg-red-400">
                    {userBookings.length}
                  </span>
                )}
              </button>
              {userBusiness && (
                <button
                  onClick={() => setActiveSection('business')}
                  className={`${
                    activeSection === 'business'
                      ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100'
                  } px-3 py-2 text-sm font-medium relative`}
                >
                  My Business
                  {businessReservations.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center dark:bg-green-400">
                      {businessReservations.length}
                    </span>
                  )}
                </button>
              )}
              <button
                onClick={() => setActiveSection('profile')}
                className={`${
                  activeSection === 'profile'
                    ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100'
                } px-3 py-2 text-sm font-medium`}
              >
                Profile
              </button>
              <button
                onClick={() => navigate('/subscription')}
                className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 px-3 py-2 text-sm font-medium relative"
              >
                <span className="flex items-center space-x-1">
                  <span>💎</span>
                  <span>Subscription</span>
                </span>
              </button>
            </nav>

            {/* User menu */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user?.email || 'User'}
              </span>
              {!userBusiness && (
                <Link
                  to="/register-business"
                  className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  List Your Business
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-200 dark:border-gray-600">
          <div className="flex space-x-1 px-4 py-2">
            <button
              onClick={() => setActiveSection('discover')}
              className={`${
                activeSection === 'discover' 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200' 
                  : 'text-gray-600 dark:text-gray-300'
              } flex-1 px-3 py-2 text-sm font-medium rounded-md`}
            >
              Discover
            </button>
            <button
              onClick={() => setActiveSection('bookings')}
              className={`${
                activeSection === 'bookings' 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200' 
                  : 'text-gray-600 dark:text-gray-300'
              } flex-1 px-3 py-2 text-sm font-medium rounded-md relative`}
            >
              Bookings
              {userBookings.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center dark:bg-red-400">
                  {userBookings.length}
                </span>
              )}
            </button>
            {userBusiness && (
              <button
                onClick={() => setActiveSection('business')}
                className={`${
                  activeSection === 'business' 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200' 
                    : 'text-gray-600 dark:text-gray-300'
                } flex-1 px-3 py-2 text-sm font-medium rounded-md relative`}
              >
                Business
                {businessReservations.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center dark:bg-green-400">
                    {businessReservations.length}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => setActiveSection('profile')}
              className={`${
                activeSection === 'profile' 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200' 
                  : 'text-gray-600 dark:text-gray-300'
              } flex-1 px-3 py-2 text-sm font-medium rounded-md`}
            >
              Profile
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 dark:bg-gray-900 transition-colors">
        {activeSection === 'discover' && (
          <div>
            {/* Search and Filters */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search businesses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-300 dark:focus:ring-blue-400"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400"
                  >
                    {businessTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Location..."
                    value={filters.location}
                    onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-300 dark:focus:ring-blue-400"
                  />
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <p className="text-gray-600 dark:text-gray-300">
                  {filteredBusinesses.length} businesses found
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate('/discover')}
                    className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-900"
                  >
                    Map View
                  </button>
                </div>
              </div>
            </div>

            {/* Business Grid */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1,
                    delayChildren: 0.2
                  }
                }
              }}
            >
              {currentBusinesses.map((business, index) => (
                <motion.div
                  key={business.id}
                  variants={{
                    hidden: { opacity: 0, y: 20, scale: 0.95 },
                    visible: { 
                      opacity: 1, 
                      y: 0, 
                      scale: 1,
                      transition: { 
                        type: "spring", 
                        stiffness: 300, 
                        damping: 30 
                      }
                    }
                  }}
                >
                  <BusinessCard
                    business={business}
                    onSelect={handleBusinessSelect}
                    onBookNow={handleBookNow}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center">
                <nav className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-3 py-2 rounded ${
                        currentPage === i + 1
                          ? 'bg-blue-600 text-white dark:bg-blue-500'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}

            {filteredBusinesses.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg dark:text-gray-400">No businesses found matching your criteria.</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilters({ type: '', location: '', rating: '', priceRange: '' });
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        )}

        {activeSection === 'bookings' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 dark:text-white">My Bookings</h2>
            {!Array.isArray(userBookings) || userBookings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg dark:text-gray-400">You don't have any bookings yet.</p>
                <button
                  onClick={() => setActiveSection('discover')}
                  className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  Discover Businesses
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {userBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === 'business' && userBusiness && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 dark:text-white">My Business Management</h2>
            
            {/* Business View Tabs */}
            <div className="bg-white rounded-lg shadow mb-6 dark:bg-gray-800 dark:shadow-gray-700">
              <div className="border-b border-gray-200 dark:border-gray-600">
                <nav className="-mb-px flex">
                  <button
                    onClick={() => setBusinessView('overview')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 ${
                      businessView === 'overview' 
                        ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setBusinessView('calendar')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 ${
                      businessView === 'calendar' 
                        ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'
                    }`}
                  >
                    📅 Reservation Calendar
                  </button>
                  <button
                    onClick={() => setBusinessView('reservations')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 ${
                      businessView === 'reservations' 
                        ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'
                    }`}
                  >
                    📋 All Reservations ({businessReservations.length})
                  </button>
                </nav>
              </div>
            </div>

            {/* Overview Tab */}
            {businessView === 'overview' && (
              <>
                {/* Business Information */}
                <div className="bg-white rounded-lg shadow p-6 mb-8 dark:bg-gray-800 dark:shadow-gray-700">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{userBusiness.name}</h3>
                      <p className="text-gray-600 capitalize dark:text-gray-300">{userBusiness.type.replace('_', ' ')}</p>
                      <p className="text-gray-600 dark:text-gray-300">📍 {userBusiness.location}</p>
                      {userBusiness.phone && <p className="text-gray-600 dark:text-gray-300">📞 {userBusiness.phone}</p>}
                    </div>
                    <button
                      onClick={() => setShowBusinessEditModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                    >
                      Edit Business
                    </button>
                  </div>
                  {userBusiness.description && (
                    <p className="text-gray-700 dark:text-gray-300">{userBusiness.description}</p>
                  )}
                  <div className="mt-4 flex gap-4">
                    <Link
                      to="/business-dashboard"
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                    >
                      Advanced Settings
                    </Link>
                  </div>
                </div>

                {/* Recent Reservations Summary */}
                <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800 dark:shadow-gray-700">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Recent Reservations ({businessReservations.length})
                    </h4>
                    <button
                      onClick={() => setBusinessView('calendar')}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Calendar →
                    </button>
                  </div>
              
                  {businessReservations.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No reservations yet.</p>
                      <p className="text-gray-400 text-sm mt-2">
                        Customers will see your business in the discovery section and can book appointments.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {businessReservations.slice(0, 5).map((reservation) => (
                        <ReservationCard 
                          key={reservation.id} 
                          reservation={reservation}
                          onStatusUpdate={handleReservationStatusUpdate}
                        />
                      ))}
                      {businessReservations.length > 5 && (
                        <div className="text-center">
                          <button
                            onClick={() => setBusinessView('reservations')}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            View All Reservations ({businessReservations.length})
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Calendar Tab */}
            {businessView === 'calendar' && (
              <div>
                <BusinessCalendar reservations={businessReservations} />
              </div>
            )}

            {/* All Reservations Tab */}
            {businessView === 'reservations' && (
              <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800 dark:shadow-gray-700">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 dark:text-white">
                  All Reservations ({businessReservations.length})
                </h4>
                
                {businessReservations.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No reservations yet.</p>
                    <p className="text-gray-400 text-sm mt-2 dark:text-gray-500">
                      Customers will see your business in the discovery section and can book appointments.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {businessReservations.map((reservation) => (
                      <ReservationCard 
                        key={reservation.id} 
                        reservation={reservation}
                        onStatusUpdate={handleReservationStatusUpdate}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeSection === 'profile' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 dark:text-white">Profile & Settings</h2>
            <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800 dark:shadow-gray-700">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{user?.email}</p>
                </div>
                {userBusiness && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Your Business</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{userBusiness.name}</p>
                    <p className="text-xs text-gray-600 capitalize dark:text-gray-300">{userBusiness.type.replace('_', ' ')}</p>
                  </div>
                )}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                  {!userBusiness ? (
                    <Link
                      to="/register-business"
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                    >
                      Register Your Business
                    </Link>
                  ) : (
                    <div className="flex gap-4">
                      <button
                        onClick={() => setActiveSection('business')}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                      >
                        Manage My Business
                      </button>
                      <Link
                        to="/business-dashboard"
                        className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600"
                      >
                        Advanced Dashboard
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {showBusinessDetailModal && selectedBusiness && (
        <BusinessDetailModal
          business={selectedBusiness}
          onClose={() => {
            setShowBusinessDetailModal(false);
            setSelectedBusiness(null);
          }}
          onBookNow={(business) => {
            setShowBusinessDetailModal(false);
            setShowBookingModal(true);
          }}
        />
      )}

      {showBookingModal && selectedBusiness && (
        <BookingModal
          business={selectedBusiness}
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedBusiness(null);
          }}
          onBookingSuccess={handleBookingSuccess}
        />
      )}

      {showBusinessEditModal && (
        <BusinessEditModal
          business={userBusiness}
          isOpen={showBusinessEditModal}
          onClose={() => setShowBusinessEditModal(false)}
          onSave={handleBusinessUpdate}
        />
      )}
      </div>
    </AnimatedLayout>
  );
}

// BusinessCard component
const BusinessCard = ({ business, onSelect, onBookNow }) => {
  const getBusinessIcon = (type) => {
    const icons = {
      barbershop: '✂️',
      beauty_salon: '💄',
      restaurant: '🍽️',
      cafe: '☕',
      football_field: '⚽',
      tennis_court: '🎾',
      gym: '🏋️',
      car_wash: '🚗',
      spa: '🧘',
      dentist: '🦷',
      doctor: '👩‍⚕️',
      other: '🏢'
    };
    return icons[type] || icons.other;
  };

  return (
    <motion.div 
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 dark:bg-gray-800 dark:shadow-gray-700 dark:hover:shadow-gray-600"
      whileHover={{ 
        scale: 1.02,
        boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)",
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center mb-4">
        <span className="text-2xl mr-3">{getBusinessIcon(business.type)}</span>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{business.name}</h3>
          <p className="text-sm text-gray-600 capitalize dark:text-gray-300">{business.type.replace('_', ' ')}</p>
        </div>
      </div>
      
      <p className="text-gray-600 text-sm mb-4 line-clamp-2 dark:text-gray-400">
        {business.description || 'No description available'}
      </p>
      
      <div className="space-y-2 mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          📍 {business.location}
        </p>
        {business.rating && (
          <div className="flex items-center">
            <span className="text-yellow-400">⭐</span>
            <span className="text-sm text-gray-600 ml-1 dark:text-gray-400">{business.rating}/5</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onSelect(business)}
          className="flex-1 px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors text-sm dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-900"
        >
          View Details
        </button>
        <button
          onClick={() => onBookNow(business)}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          Book Now
        </button>
      </div>
    </motion.div>
  );
};

// BookingCard component for displaying user bookings
const BookingCard = ({ booking }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800 dark:shadow-gray-700">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{booking.business_name}</h3>
          <p className="text-gray-600 dark:text-gray-300">{booking.business_type}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
          {booking.status}
        </span>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">Date:</span> {new Date(booking.booking_date).toLocaleDateString()}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">Time:</span> {booking.booking_time}
        </p>
        {booking.notes && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Notes:</span> {booking.notes}
          </p>
        )}
        {booking.total_amount && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Amount:</span> {booking.total_amount} TND
          </p>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        {booking.status === 'confirmed' && (
          <>
            <button className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600">
              Reschedule
            </button>
            <button className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600">
              Cancel
            </button>
          </>
        )}
        <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
          View Details
        </button>
      </div>
    </div>
  );
};

// BusinessEditModal component
const BusinessEditModal = ({ business, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: business?.name || '',
    type: business?.type || '',
    location: business?.location || '',
    phone: business?.phone || '',
    description: business?.description || ''
  });

  const businessTypes = [
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
    if (business) {
      setFormData({
        name: business.name || '',
        type: business.type || '',
        location: business.location || '',
        phone: business.phone || '',
        description: business.description || ''
      });
    }
  }, [business]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto dark:bg-gray-800 dark:shadow-gray-700">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Business Information</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl dark:text-gray-500 dark:hover:text-gray-300"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                Business Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                Business Type *
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400"
              >
                <option value="">Select a type</option>
                {businessTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                Location *
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-400"
                placeholder="Street address, city"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-400"
                placeholder="+216 XX XXX XXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-400"
                placeholder="Brief description of your business..."
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Home;
