import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { ThemeToggle } from '../contexts/ThemeContext';
import { cn } from '../utils/cn';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';

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
    expanded: { 
      width: '280px',
      transition: { duration: 0.3, ease: 'easeInOut' }
    },
    collapsed: { 
      width: '80px',
      transition: { duration: 0.3, ease: 'easeInOut' }
    }
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
      className={cn(
        "w-full flex items-center rounded-xl transition-all duration-300 group relative overflow-hidden",
        isCollapsed ? "px-2 py-3 justify-center" : "px-4 py-3",
        activeSection === item.id
          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20"
          : "text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 dark:hover:from-gray-700 dark:hover:to-gray-750 hover:shadow-md"
      )}
      whileHover={{ scale: 1.02, x: isCollapsed ? 0 : 4 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Animated background on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
        initial={false}
      />
      
      <span className="text-xl flex-shrink-0 relative z-10">{item.icon}</span>
      
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            className="ml-3 flex-1 text-left relative z-10"
            variants={menuItemVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
          >
            <div className="font-semibold text-sm">{item.label}</div>
            <div className={cn(
              "text-xs",
              activeSection === item.id ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
            )}>
              {item.description}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {item.badge > 0 && (
        <Badge 
          variant={item.badgeColor === 'green' ? 'default' : 'destructive'}
          className={cn(
            "relative z-10 shadow-lg animate-pulse",
            item.badgeColor === 'green' && 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600',
            isCollapsed && 'absolute -top-1 -right-1'
          )}
        >
          {item.badge}
        </Badge>
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
        className={cn(
          "fixed left-0 top-0 h-full bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 border-r border-gray-200 dark:border-gray-800 shadow-2xl z-40 flex flex-col backdrop-blur-xl",
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0 transition-transform duration-300'
        )}
        variants={sidebarVariants}
        animate={isCollapsed ? 'collapsed' : 'expanded'}
        initial={false}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{ minWidth: isCollapsed ? '80px' : '280px' }}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                className="flex items-center space-x-2"
                variants={menuItemVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
              >
                <motion.div 
                  className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg"
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                >
                  <span className="text-white font-bold text-lg">R</span>
                </motion.div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Rezervi</h1>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Smart Booking</p>
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
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className={cn(
            "flex items-center bg-white dark:bg-gray-800 rounded-xl p-3 shadow-md",
            isCollapsed ? "justify-center" : "space-x-3"
          )}>
            <motion.div whileHover={{ scale: 1.1, rotate: 5 }}>
              <Avatar className="h-12 w-12 ring-2 ring-white dark:ring-gray-700 shadow-lg">
                <AvatarImage src={user?.profile_picture_url} alt={user?.username} />
                <AvatarFallback className="bg-gradient-to-br from-green-400 via-blue-500 to-purple-500 text-white font-bold text-lg">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </motion.div>
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
        <ScrollArea className="flex-1">
          <nav className="p-4 space-y-2">
            {navigationItems.map((item) => (
              <NavItem key={item.id} item={item} />
            ))}
          </nav>
        </ScrollArea>

        {/* Action Buttons */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-3 bg-gradient-to-b from-transparent to-gray-50 dark:to-gray-900">
          <AnimatePresence>
            {!isCollapsed && !userBusiness && (
              <motion.div
                variants={menuItemVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
              >
                <Button
                  asChild
                  className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 border-0"
                  size="lg"
                >
                  <Link to="/register-business" className="flex items-center justify-center">
                    <span className="mr-2 text-lg">🏪</span>
                    <span className="font-semibold">List Your Business</span>
                  </Link>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            onClick={() => navigate('/subscription')}
            className={cn(
              "w-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 hover:from-purple-600 hover:to-pink-700 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 border-0",
              isCollapsed ? 'justify-center' : ''
            )}
            size="lg"
          >
            <span className="text-xl">💎</span>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  className="ml-2 font-semibold"
                  variants={menuItemVariants}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                >
                  Subscription
                </motion.span>
              )}
            </AnimatePresence>
          </Button>

          <Separator className="my-2" />

          <div className="pt-2">
            <ThemeToggle />
          </div>

          {/* Logout */}
          <Button
            onClick={onLogout}
            variant="outline"
            className={cn(
              "w-full bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border-red-200 dark:border-red-800",
              isCollapsed ? 'justify-center' : ''
            )}
            size="lg"
          >
            <span className="text-xl">🚪</span>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  className="ml-2 font-semibold"
                  variants={menuItemVariants}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </motion.aside>
    </>
  );
};

export default ModernSidebar;