import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';

// Import components
import BusinessProfile from '../components/BusinessProfile';
import BusinessStats from '../components/BusinessStats';
import BusinessCalendar from '../components/BusinessCalendarNew';
import ReservationManagement from '../components/ReservationManagement';
import BusinessSettings from '../components/BusinessSettings';
import AvailabilityManager from '../components/AvailabilityManager';

const MyBusiness = () => {
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Navigation items for sidebar
  const navigationItems = [
    { 
      id: 'overview', 
      label: 'Overview', 
      icon: '📊',
      description: 'Dashboard & Analytics'
    },
    { 
      id: 'reservations', 
      label: 'Reservations', 
      icon: '📅',
      description: 'Manage Bookings'
    },
    { 
      id: 'calendar', 
      label: 'Calendar', 
      icon: '🗓️',
      description: 'Schedule View'
    },
    { 
      id: 'availability', 
      label: 'Availability', 
      icon: '🕐',
      description: 'Working Hours & Slots'
    },
    { 
      id: 'profile', 
      label: 'Business Profile', 
      icon: '🏢',
      description: 'Edit Information'
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: '⚙️',
      description: 'Configure Business'
    }
  ];

  // Fetch all business data
  useEffect(() => {
    fetchBusinessData();
  }, []);

  const fetchBusinessData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch business information
      const businessRes = await API.get('/api/business/user-business');
      if (!businessRes.data.business) {
        navigate('/register-business');
        return;
      }
      setBusiness(businessRes.data.business);

      // Fetch reservations
      const reservationsRes = await API.get('/api/business/reservations');
      setReservations(reservationsRes.data.reservations || []);

      // Fetch settings
      const settingsRes = await API.get('/api/business/settings');
      setSettings(settingsRes.data.settings || {});

      // Calculate analytics
      calculateAnalytics(reservationsRes.data.reservations || []);

    } catch (err) {
      console.error('Error fetching business data:', err);
      setError(err.response?.data?.error || 'Failed to load business data');
      
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (reservationData) => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    // Filter reservations for current month
    const thisMonthReservations = reservationData.filter(res => {
      const resDate = new Date(res.date);
      return resDate.getMonth() === thisMonth && resDate.getFullYear() === thisYear;
    });

    // Filter for today
    const today = now.toDateString();
    const todayReservations = reservationData.filter(res => 
      new Date(res.date).toDateString() === today
    );

    // Calculate revenue (simplified)
    const totalRevenue = reservationData.reduce((sum, res) => {
      return sum + (res.amount || 50); // Default amount if not set
    }, 0);

    const monthlyRevenue = thisMonthReservations.reduce((sum, res) => {
      return sum + (res.amount || 50);
    }, 0);

    setAnalytics({
      totalReservations: reservationData.length,
      monthlyReservations: thisMonthReservations.length,
      todayReservations: todayReservations.length,
      totalRevenue,
      monthlyRevenue,
      averageRating: 4.5, // Placeholder
      completionRate: 95 // Placeholder
    });
  };

  // Statistics cards data
  const statsCards = useMemo(() => [
    {
      title: 'Today\'s Bookings',
      value: analytics.todayReservations || 0,
      change: '+12%',
      changeType: 'positive',
      icon: '📅',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'This Month',
      value: analytics.monthlyReservations || 0,
      change: '+8%',
      changeType: 'positive',
      icon: '📊',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Total Revenue',
      value: `$${analytics.totalRevenue || 0}`,
      change: '+15%',
      changeType: 'positive',
      icon: '💰',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Avg. Rating',
      value: analytics.averageRating || '4.5',
      change: '+0.2',
      changeType: 'positive',
      icon: '⭐',
      color: 'from-yellow-500 to-yellow-600'
    }
  ], [analytics]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center"
        >
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Business</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="flex h-screen">
        {/* Sidebar */}
        <motion.div 
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          className="w-80 bg-white/80 backdrop-blur-xl dark:bg-gray-800/80 border-r border-gray-200/50 dark:border-gray-700/50 shadow-xl"
        >
          {/* Business Header */}
          <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center space-x-4"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">
                {business?.name?.charAt(0) || 'B'}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {business?.name || 'My Business'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                  {business?.type?.replace('_', ' ') || 'Business'}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-2">
            {navigationItems.map((item, index) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-4 p-4 rounded-xl transition-all duration-300 ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                }`}
              >
                <span className="text-2xl">{item.icon}</span>
                <div className="text-left">
                  <div className="font-semibold">{item.label}</div>
                  <div className={`text-xs ${
                    activeTab === item.id ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {item.description}
                  </div>
                </div>
              </motion.button>
            ))}
          </nav>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="p-4 m-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Quick Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Today</span>
                <span className="font-semibold text-blue-600">{analytics.todayReservations}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">This Month</span>
                <span className="font-semibold text-green-600">{analytics.monthlyReservations}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Rating</span>
                <span className="font-semibold text-yellow-600">{analytics.averageRating}⭐</span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full overflow-y-auto"
            >
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="p-8">
                  <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      Business Overview
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                      Monitor your business performance and manage operations
                    </p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                    {statsCards.map((stat, index) => (
                      <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-white text-xl`}>
                            {stat.icon}
                          </div>
                          <div className={`text-sm font-semibold px-2 py-1 rounded-full ${
                            stat.changeType === 'positive' 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {stat.change}
                          </div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                            {stat.value}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {stat.title}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Business Stats Component */}
                  <BusinessStats reservations={reservations} analytics={analytics} />
                </div>
              )}

              {/* Reservations Tab */}
              {activeTab === 'reservations' && (
                <div className="p-8">
                  <ReservationManagement 
                    reservations={reservations} 
                    onReservationUpdate={fetchBusinessData}
                  />
                </div>
              )}

              {/* Calendar Tab */}
              {activeTab === 'calendar' && (
                <div className="p-8">
                  <BusinessCalendar 
                    reservations={reservations}
                    business={business}
                    onReservationUpdate={fetchBusinessData}
                  />
                </div>
              )}

              {/* Availability Tab */}
              {activeTab === 'availability' && (
                <div className="p-8">
                  <AvailabilityManager 
                    settings={settings}
                    onSettingsUpdate={fetchBusinessData}
                  />
                </div>
              )}

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="p-8">
                  <BusinessProfile 
                    business={business}
                    onBusinessUpdate={fetchBusinessData}
                  />
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="p-8">
                  <BusinessSettings 
                    settings={settings}
                    onSettingsUpdate={fetchBusinessData}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default MyBusiness;