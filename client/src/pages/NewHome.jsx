import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../utils/api';
import BusinessDetailModal from '../components/BusinessDetailModal';
import BookingModal from '../components/BookingModal';
import BusinessCalendar from '../components/BusinessCalendar';
import ReservationCard from '../components/ReservationCard';
import { ThemeToggle } from '../contexts/ThemeContext';
import AnimatedLayout from '../components/AnimatedLayout';
import ModernSidebar from '../components/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition-all duration-300">
        {/* Modern Sidebar */}
        <ModernSidebar
          user={user}
          userBusiness={userBusiness}
          userBookings={userBookings}
          businessReservations={businessReservations}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onLogout={handleLogout}
        />

        {/* Main Content */}
        <div className="lg:ml-[280px] ml-0 transition-all duration-300">
          <main className="min-h-screen p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8">
            <div className="max-w-7xl mx-auto w-full">
              
              <AnimatePresence mode="wait">
                {activeSection === 'discover' && (
                  <DiscoverSection 
                    key="discover"
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    filters={filters}
                    setFilters={setFilters}
                    businessTypes={businessTypes}
                    filteredBusinesses={filteredBusinesses}
                    currentBusinesses={currentBusinesses}
                    totalPages={totalPages}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    handleBusinessSelect={handleBusinessSelect}
                    handleBookNow={handleBookNow}
                    navigate={navigate}
                    loading={loading}
                  />
                )}

                {activeSection === 'bookings' && (
                  <BookingsSection 
                    key="bookings"
                    userBookings={userBookings}
                    setActiveSection={setActiveSection}
                  />
                )}

                {activeSection === 'business' && userBusiness && (
                  <BusinessSection 
                    key="business"
                    userBusiness={userBusiness}
                    businessView={businessView}
                    setBusinessView={setBusinessView}
                    businessReservations={businessReservations}
                    handleReservationStatusUpdate={handleReservationStatusUpdate}
                    setShowBusinessEditModal={setShowBusinessEditModal}
                  />
                )}

                {activeSection === 'profile' && (
                  <ProfileSection 
                    key="profile"
                    user={user}
                    userBusiness={userBusiness}
                    setActiveSection={setActiveSection}
                  />
                )}
              </AnimatePresence>
            </div>
          </main>
        </div>

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

// Discover Section Component
const DiscoverSection = ({ 
  searchTerm, setSearchTerm, filters, setFilters, businessTypes, 
  filteredBusinesses, currentBusinesses, totalPages, currentPage, setCurrentPage,
  handleBusinessSelect, handleBookNow, navigate, loading 
}) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
    className="space-y-8"
  >
    {/* Header */}
    <motion.div 
      className="text-center mb-8"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
        Discover Amazing Businesses
      </h1>
      <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
        Find and book the perfect service for your needs. From barbershops to restaurants, we've got you covered.
      </p>
    </motion.div>

    {/* Search and Filters */}
    <motion.div 
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="🔍 Search businesses, services, or locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 text-lg transition-all duration-200"
          />
        </div>
        <div className="flex gap-3">
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            className="px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white min-w-[180px] transition-all duration-200"
          >
            {businessTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="📍 Location..."
            value={filters.location}
            onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
            className="px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 min-w-[200px] transition-all duration-200"
          />
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <motion.p 
          className="text-gray-600 dark:text-gray-300"
          key={filteredBusinesses.length}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="font-semibold text-blue-600 dark:text-blue-400">{filteredBusinesses.length}</span> businesses found
        </motion.p>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/discover')}
            className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-900 flex items-center gap-2"
          >
            <span>🗺️</span>
            Map View
          </button>
        </div>
      </div>
    </motion.div>

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
            delayChildren: 0.3
          }
        }
      }}
    >
      {currentBusinesses.map((business) => (
        <motion.div
          key={business.id}
          variants={{
            hidden: { opacity: 0, y: 30, scale: 0.9 },
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
      <motion.div 
        className="flex justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <nav className="flex space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
          >
            ← Previous
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                currentPage === i + 1
                  ? 'bg-blue-600 text-white shadow-lg dark:bg-blue-500'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
          >
            Next →
          </button>
        </nav>
      </motion.div>
    )}

    {filteredBusinesses.length === 0 && !loading && (
      <motion.div 
        className="text-center py-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-6xl mb-4">🔍</div>
        <p className="text-gray-500 text-xl dark:text-gray-400 mb-6">No businesses found matching your criteria.</p>
        <button
          onClick={() => {
            setSearchTerm('');
            setFilters({ type: '', location: '', rating: '', priceRange: '' });
          }}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Clear All Filters
        </button>
      </motion.div>
    )}
  </motion.div>
);

// Bookings Section Component
const BookingsSection = ({ userBookings, setActiveSection }) => {
  const [sortBy, setSortBy] = useState('date'); // 'date', 'status', 'business'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'confirmed', 'pending', 'completed', 'cancelled'
  const [searchTerm, setSearchTerm] = useState('');

  // Filter and sort bookings
  const processedBookings = useMemo(() => {
    if (!Array.isArray(userBookings)) return [];
    
    let filtered = userBookings.filter(booking => {
      const matchesSearch = booking.business_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || booking.status === filterStatus;
      return matchesSearch && matchesStatus;
    });

    // Sort bookings
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.booking_date) - new Date(a.booking_date);
        case 'status':
          const statusOrder = { 'confirmed': 0, 'pending': 1, 'completed': 2, 'cancelled': 3 };
          return statusOrder[a.status] - statusOrder[b.status];
        case 'business':
          return a.business_name.localeCompare(b.business_name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [userBookings, sortBy, filterStatus, searchTerm]);

  const getStatusStats = () => {
    if (!Array.isArray(userBookings)) return {};
    
    return userBookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      acc.total = (acc.total || 0) + 1;
      return acc;
    }, {});
  };

  const stats = getStatusStats();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center mb-6"
      >
        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
          My Bookings
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Manage your reservations and appointments
        </p>
      </motion.div>

      {!Array.isArray(userBookings) || userBookings.length === 0 ? (
        <motion.div 
          className="text-center py-20 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div 
            className="text-8xl mb-8"
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1, 1.05, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
          >
            📅
          </motion.div>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
            No bookings yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg max-w-md mx-auto">
            Start by discovering amazing businesses near you and make your first reservation!
          </p>
          <motion.button
            onClick={() => setActiveSection('discover')}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 text-white rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 font-medium text-lg"
            whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="mr-2">🔍</span>
            Discover Businesses
          </motion.button>
        </motion.div>
      ) : (
        <>
          {/* Stats Cards - More Compact */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { staggerChildren: 0.05 }
              }
            }}
          >
            <motion.div 
              variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }}
              className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-3 border border-blue-200 dark:border-blue-700/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{stats.total || 0}</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Total</p>
                </div>
                <span className="text-lg">📊</span>
              </div>
            </motion.div>

            <motion.div 
              variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }}
              className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-3 border border-green-200 dark:border-green-700/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">{stats.confirmed || 0}</p>
                  <p className="text-xs text-green-700 dark:text-green-300 font-medium">Confirmed</p>
                </div>
                <span className="text-lg">✅</span>
              </div>
            </motion.div>

            <motion.div 
              variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }}
              className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl p-3 border border-yellow-200 dark:border-yellow-700/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending || 0}</p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">Pending</p>
                </div>
                <span className="text-lg">⏳</span>
              </div>
            </motion.div>

            <motion.div 
              variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }}
              className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-3 border border-purple-200 dark:border-purple-700/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{stats.completed || 0}</p>
                  <p className="text-xs text-purple-700 dark:text-purple-300 font-medium">Completed</p>
                </div>
                <span className="text-lg">🎉</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Filters and Search - More Compact */}
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="🔍 Search by business name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 transition-all duration-200"
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white min-w-[120px] text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white min-w-[120px] text-sm"
                >
                  <option value="date">Sort by Date</option>
                  <option value="status">Sort by Status</option>
                  <option value="business">Sort by Business</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Bookings List - Grid Layout for Compact Display */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.05, delayChildren: 0.4 }
              }
            }}
          >
            <AnimatePresence>
              {processedBookings.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="col-span-full text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                >
                  <span className="text-4xl mb-2 block">🔍</span>
                  <p className="text-gray-500 dark:text-gray-400">
                    No bookings match your search criteria
                  </p>
                </motion.div>
              ) : (
                processedBookings.map((booking, index) => (
                  <motion.div
                    key={booking.id}
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      visible: { 
                        opacity: 1, 
                        y: 0,
                        transition: { delay: index * 0.05 }
                      }
                    }}
                    layout
                  >
                    <BookingCard booking={booking} />
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

// Business Section Component (placeholder)
const BusinessSection = ({ 
  userBusiness, businessView, setBusinessView, 
  businessReservations, handleReservationStatusUpdate, setShowBusinessEditModal 
}) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
    className="space-y-6"
  >
    <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
      My Business Management
    </h2>
    {/* Add business management content here */}
  </motion.div>
);

// Profile Section Component (placeholder)
const ProfileSection = ({ user, userBusiness, setActiveSection }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
    className="space-y-6"
  >
    <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
      Profile & Settings
    </h2>
    {/* Add profile content here */}
  </motion.div>
);

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
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 dark:border-gray-700 h-full flex flex-col"
      whileHover={{ 
        scale: 1.02,
        y: -4,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center text-2xl mr-4">
          {getBusinessIcon(business.type)}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{business.name}</h3>
          <p className="text-sm text-gray-600 capitalize dark:text-gray-300 mb-2">
            {business.type.replace('_', ' ')}
          </p>
        </div>
      </div>
      
      <p className="text-gray-600 text-sm mb-4 line-clamp-2 dark:text-gray-400 flex-grow">
        {business.description || 'Professional service provider offering quality solutions for your needs.'}
      </p>
      
      <div className="space-y-2 mb-6">
        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
          <span className="mr-2">📍</span>
          {business.location}
        </p>
        {business.rating && (
          <div className="flex items-center">
            <span className="text-yellow-400 mr-1">⭐</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {business.rating}/5
            </span>
            <span className="text-xs text-gray-500 ml-2">({business.reviews || 0} reviews)</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-auto">
        <button
          onClick={() => onSelect(business)}
          className="flex-1 px-4 py-3 text-blue-600 border border-blue-600 rounded-xl hover:bg-blue-50 transition-colors text-sm font-medium dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-900"
        >
          View Details
        </button>
        <button
          onClick={() => onBookNow(business)}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg"
        >
          Book Now
        </button>
      </div>
    </motion.div>
  );
};

// BookingCard component for displaying user bookings
const BookingCard = ({ booking }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'confirmed': 
        return { 
          color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-700',
          icon: '✅',
          bgGradient: 'from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10'
        };
      case 'pending': 
        return { 
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700',
          icon: '⏳',
          bgGradient: 'from-yellow-50 to-amber-50 dark:from-yellow-900/10 dark:to-amber-900/10'
        };
      case 'cancelled': 
        return { 
          color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-700',
          icon: '❌',
          bgGradient: 'from-red-50 to-rose-50 dark:from-red-900/10 dark:to-rose-900/10'
        };
      case 'completed': 
        return { 
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-700',
          icon: '🎉',
          bgGradient: 'from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10'
        };
      default: 
        return { 
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600',
          icon: '📅',
          bgGradient: 'from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800'
        };
    }
  };

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

  const statusConfig = getStatusConfig(booking.status);
  const businessIcon = getBusinessIcon(booking.business_type);

  return (
    <motion.div 
      className={`relative overflow-hidden bg-gradient-to-br ${statusConfig.bgGradient} rounded-xl shadow-sm hover:shadow-md border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm`}
      whileHover={{ 
        scale: 1.01, 
        y: -1,
        boxShadow: "0 4px 8px -2px rgba(0, 0, 0, 0.1)"
      }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      {/* Status indicator stripe */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${
        booking.status === 'confirmed' ? 'from-green-400 to-emerald-500' :
        booking.status === 'pending' ? 'from-yellow-400 to-amber-500' :
        booking.status === 'cancelled' ? 'from-red-400 to-rose-500' :
        booking.status === 'completed' ? 'from-blue-400 to-indigo-500' :
        'from-gray-400 to-slate-500'
      }`} />

      <div className="p-3">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-sm flex-shrink-0">
              {businessIcon}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {booking.business_name}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 capitalize truncate">
                {booking.business_type?.replace('_', ' ')}
              </p>
            </div>
          </div>
          
          <motion.div 
            className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium border ${statusConfig.color} flex-shrink-0`}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <span className="text-xs">{statusConfig.icon}</span>
            <span className="capitalize">{booking.status}</span>
          </motion.div>
        </div>
        
        {/* Compact Info Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-2">
            <div className="flex items-center space-x-1 mb-1">
              <span className="text-blue-500 text-xs">📅</span>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Date</p>
            </div>
            <p className="text-xs font-semibold text-gray-900 dark:text-white">
              {new Date(booking.booking_date).toLocaleDateString('en-US', {
                month: 'short', 
                day: 'numeric'
              })}
            </p>
          </div>
          
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-2">
            <div className="flex items-center space-x-1 mb-1">
              <span className="text-purple-500 text-xs">🕒</span>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Time</p>
            </div>
            <p className="text-xs font-semibold text-gray-900 dark:text-white">
              {booking.booking_time}
            </p>
          </div>
        </div>

        {/* Compact Additional Info */}
        <div className="flex justify-between items-center mb-3 text-xs">
          {booking.total_amount && (
            <div className="flex items-center space-x-1">
              <span className="text-green-500">�</span>
              <span className="font-bold text-green-600 dark:text-green-400">
                {booking.total_amount} TND
              </span>
            </div>
          )}
          
          {booking.notes && (
            <div className="flex items-center space-x-1 flex-1 min-w-0 ml-2">
              <span className="text-orange-500">�</span>
              <span className="text-gray-600 dark:text-gray-400 truncate">
                {booking.notes.length > 15 ? booking.notes.substring(0, 15) + '...' : booking.notes}
              </span>
            </div>
          )}
        </div>

        {/* Compact Action Buttons */}
        <div className="flex gap-1">
          {booking.status === 'confirmed' && (
            <>
              <motion.button 
                className="flex-1 px-2 py-1.5 text-xs font-medium bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center space-x-1"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>🔄</span>
                <span>Reschedule</span>
              </motion.button>
              
              <motion.button 
                className="flex-1 px-2 py-1.5 text-xs font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center space-x-1"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>🚫</span>
                <span>Cancel</span>
              </motion.button>
            </>
          )}
          
          <motion.button 
            className={`${booking.status === 'confirmed' ? 'w-full mt-1' : 'flex-1'} px-2 py-1.5 text-xs font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-1`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>👁️</span>
            <span>Details</span>
          </motion.button>
        </div>
      </div>

      {/* Subtle background pattern - smaller */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, rgba(168, 85, 247, 0.05) 0%, transparent 50%)`
        }} />
      </div>
    </motion.div>
  );
};

// BusinessEditModal component (placeholder)
const BusinessEditModal = ({ business, isOpen, onClose, onSave }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Edit Business</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">Business editing functionality coming soon...</p>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default Home;