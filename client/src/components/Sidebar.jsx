import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { ThemeToggle } from '../contexts/ThemeContext';

const ModernSidebar = ({ 
  user, 
  userBusiness, 
  userBookings, 
  businessReservations, 
  activeSection, 
  onSectionChange, 
  onLogout 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();

  const navigationItems = [
    {
      id: 'discover',
      label: 'Discover',
      icon: '🔍',
      description: 'Find businesses'
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: '💬',
      description: 'Chat with businesses'
    },
    {
      id: 'bookings',
      label: 'My Bookings',
      icon: '📅',
      description: 'Your reservations',
      badge: userBookings?.length || 0
    },
    ...(userBusiness ? [
      {
        id: 'business',
        label: 'My Business',
        icon: '🏢',
        description: 'Manage your business',
        badge: businessReservations?.length || 0,
        badgeColor: 'green'
      },
      {
        id: 'business-calendar',
        label: 'Business Calendar',
        icon: '📆',
        description: 'View bookings calendar'
      }
    ] : []),
    {
      id: 'profile',
      label: 'Profile',
      icon: '👤',
      description: 'Account settings'
    }
  ];

  const handleNavigation = (sectionId) => {
    onSectionChange(sectionId);
    setIsMobileOpen(false);
  };

  const sidebarVariants = {
    expanded: { width: '280px' },
    collapsed: { width: '80px' }
  };

  const menuItemVariants = {
    expanded: { opacity: 1, x: 0 },
    collapsed: { opacity: 0, x: -10 }
  };

  const NavItem = ({ item }) => (
    <motion.button
      onClick={() => {
        if (item.route) {
          navigate(item.route);
          setIsMobileOpen(false);
        } else if (item.path) {
          navigate(item.path);
          setIsMobileOpen(false);
        } else {
          handleNavigation(item.id);
        }
      }}
      className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 group relative ${
        activeSection === item.id
          ? 'bg-blue-500 text-white shadow-lg'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="text-xl flex-shrink-0">{item.icon}</span>
      
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            className="ml-3 flex-1 text-left"
            variants={menuItemVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
          >
            <div className="font-medium text-sm">{item.label}</div>
            <div className={`text-xs ${
              activeSection === item.id ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
            }`}>
              {item.description}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {item.badge > 0 && (
        <motion.span
          className={`${
            item.badgeColor === 'green' 
              ? 'bg-green-500 dark:bg-green-400' 
              : 'bg-red-500 dark:bg-red-400'
          } text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium ${
            isCollapsed ? 'absolute -top-1 -right-1' : ''
          }`}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.3 }}
        >
          {item.badge}
        </motion.span>
      )}
    </motion.button>
  );

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Toggle Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg border dark:border-gray-700"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        <motion.div
          animate={{ rotate: isMobileOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </motion.div>
      </button>

      {/* Sidebar */}
      <motion.aside
        className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg z-40 flex flex-col ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform lg:transition-none`}
        variants={sidebarVariants}
        animate={isCollapsed ? 'collapsed' : 'expanded'}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                className="flex items-center space-x-2"
                variants={menuItemVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">R</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white">Rezervi</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Smart Booking</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <motion.svg
              className="w-5 h-5 text-gray-600 dark:text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              animate={{ rotate: isCollapsed ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </motion.svg>
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  className="flex-1 min-w-0"
                  variants={menuItemVariants}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user?.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.email || 'user@example.com'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => (
            <NavItem key={item.id} item={item} />
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <AnimatePresence>
            {!isCollapsed && !userBusiness && (
              <motion.div
                variants={menuItemVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
              >
                <Link
                  to="/register-business"
                  className="w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <span className="mr-2">🏪</span>
                  <span className="font-medium">List Your Business</span>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => navigate('/subscription')}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : ''} px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg`}
          >
            <span className="text-lg">💎</span>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  className="ml-2 font-medium"
                  variants={menuItemVariants}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                >
                  Subscription
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          

          {/* Logout */}
          <button
            onClick={onLogout}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : ''} px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-all duration-200`}
          >
            <span className="text-lg">🚪</span>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  className="ml-2 font-medium"
                  variants={menuItemVariants}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>
    </>
  );
};

export default ModernSidebar;