import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../utils/api';

const ReservationManagement = ({ reservations = [], onReservationUpdate }) => {
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [loading, setLoading] = useState({});

  const statusOptions = [
    { value: 'all', label: 'All Bookings', color: 'gray' },
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'confirmed', label: 'Confirmed', color: 'green' },
    { value: 'completed', label: 'Completed', color: 'blue' },
    { value: 'cancelled', label: 'Cancelled', color: 'red' }
  ];

  // Filter and sort reservations
  const filteredReservations = useMemo(() => {
    let filtered = [...reservations];

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(res => (res.status || 'pending') === selectedStatus);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(res =>
        res.users?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.customer_phone?.includes(searchTerm)
      );
    }

    // Sort reservations
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'date':
          aVal = new Date(a.date + ' ' + a.time);
          bVal = new Date(b.date + ' ' + b.time);
          break;
        case 'customer':
          aVal = (a.users?.full_name || a.customer_name || '').toLowerCase();
          bVal = (b.users?.full_name || b.customer_name || '').toLowerCase();
          break;
        case 'status':
          aVal = a.status || 'pending';
          bVal = b.status || 'pending';
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    return filtered;
  }, [reservations, selectedStatus, searchTerm, sortBy, sortOrder]);

  const updateReservationStatus = async (reservationId, newStatus) => {
    setLoading(prev => ({ ...prev, [reservationId]: true }));
    
    try {
      await API.put(`/api/business/reservations/${reservationId}`, {
        status: newStatus
      });
      
      if (onReservationUpdate) {
        onReservationUpdate();
      }
    } catch (error) {
      console.error('Error updating reservation:', error);
      alert('Failed to update reservation status');
    } finally {
      setLoading(prev => ({ ...prev, [reservationId]: false }));
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400',
      confirmed: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400',
      completed: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
      cancelled: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400'
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      confirmed: '✅',
      completed: '🎉',
      cancelled: '❌'
    };
    return icons[status] || icons.pending;
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayReservations = reservations.filter(res => 
      new Date(res.date).toDateString() === today
    );

    return {
      total: reservations.length,
      today: todayReservations.length,
      pending: reservations.filter(res => (res.status || 'pending') === 'pending').length,
      confirmed: reservations.filter(res => res.status === 'confirmed').length,
      completed: reservations.filter(res => res.status === 'completed').length
    };
  }, [reservations]);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Reservation Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage and track all your business reservations
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg"
        >
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-blue-100">Total Bookings</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-lg"
        >
          <div className="text-2xl font-bold">{stats.today}</div>
          <div className="text-green-100">Today</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-2xl shadow-lg"
        >
          <div className="text-2xl font-bold">{stats.pending}</div>
          <div className="text-yellow-100">Pending</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-6 rounded-2xl shadow-lg"
        >
          <div className="text-2xl font-bold">{stats.confirmed}</div>
          <div className="text-emerald-100">Confirmed</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg"
        >
          <div className="text-2xl font-bold">{stats.completed}</div>
          <div className="text-purple-100">Completed</div>
        </motion.div>
      </div>

      {/* Filters and Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50 mb-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Customer
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or phone..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="date">Date & Time</option>
              <option value="customer">Customer Name</option>
              <option value="status">Status</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sort Order
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Reservations List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
      >
        {filteredReservations.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No reservations found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {selectedStatus !== 'all' || searchTerm 
                ? 'Try adjusting your filters or search criteria'
                : 'No reservations have been made yet'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <AnimatePresence>
                  {filteredReservations.map((reservation, index) => (
                    <motion.tr
                      key={reservation.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                            {(reservation.users?.full_name || reservation.customer_name || 'U').charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {reservation.users?.full_name || reservation.customer_name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              ID: {reservation.id.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {new Date(reservation.date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {reservation.time}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          📞 {reservation.customer_phone || 'N/A'}
                        </div>
                        {reservation.customer_email && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            ✉️ {reservation.customer_email}
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(reservation.status || 'pending')}`}>
                          {getStatusIcon(reservation.status || 'pending')} {reservation.status || 'pending'}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          {reservation.status !== 'confirmed' && (
                            <button
                              onClick={() => updateReservationStatus(reservation.id, 'confirmed')}
                              disabled={loading[reservation.id]}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                            >
                              ✅ Confirm
                            </button>
                          )}
                          {reservation.status !== 'completed' && reservation.status === 'confirmed' && (
                            <button
                              onClick={() => updateReservationStatus(reservation.id, 'completed')}
                              disabled={loading[reservation.id]}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                            >
                              🎉 Complete
                            </button>
                          )}
                          {reservation.status !== 'cancelled' && (
                            <button
                              onClick={() => updateReservationStatus(reservation.id, 'cancelled')}
                              disabled={loading[reservation.id]}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                            >
                              ❌ Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ReservationManagement;