import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const BusinessStats = ({ reservations = [], analytics = {} }) => {
  
  // Prepare chart data
  const chartData = useMemo(() => {
    // Get last 7 days data
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toDateString();
    }).reverse();

    const dailyBookings = last7Days.map(day => {
      return reservations.filter(res => 
        new Date(res.date).toDateString() === day
      ).length;
    });

    const dailyLabels = last7Days.map(day => 
      new Date(day).toLocaleDateString('en-US', { weekday: 'short' })
    );

    // Monthly data
    const currentMonth = new Date().getMonth();
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      return reservations.filter(res => {
        const resDate = new Date(res.date);
        return resDate.getMonth() === i;
      }).length;
    });

    const monthLabels = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    // Status distribution
    const statusCounts = reservations.reduce((acc, res) => {
      const status = res.status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return {
      daily: {
        labels: dailyLabels,
        datasets: [
          {
            label: 'Daily Bookings',
            data: dailyBookings,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true,
          },
        ],
      },
      monthly: {
        labels: monthLabels,
        datasets: [
          {
            label: 'Monthly Bookings',
            data: monthlyData,
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)',
              'rgba(16, 185, 129, 0.8)',
              'rgba(245, 158, 11, 0.8)',
              'rgba(239, 68, 68, 0.8)',
              'rgba(139, 92, 246, 0.8)',
              'rgba(236, 72, 153, 0.8)',
            ],
            borderColor: [
              'rgb(59, 130, 246)',
              'rgb(16, 185, 129)',
              'rgb(245, 158, 11)',
              'rgb(239, 68, 68)',
              'rgb(139, 92, 246)',
              'rgb(236, 72, 153)',
            ],
            borderWidth: 2,
          },
        ],
      },
      status: {
        labels: Object.keys(statusCounts),
        datasets: [
          {
            data: Object.values(statusCounts),
            backgroundColor: [
              '#10B981', // confirmed - green
              '#F59E0B', // pending - yellow
              '#EF4444', // cancelled - red
              '#8B5CF6', // completed - purple
            ],
            borderWidth: 0,
          },
        ],
      },
    };
  }, [reservations]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  return (
    <div className="space-y-8">
      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
      >
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          📈 Weekly Booking Trends
        </h3>
        <div className="h-64">
          <Line data={chartData.daily} options={chartOptions} />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
        >
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            📊 Monthly Performance
          </h3>
          <div className="h-64">
            <Bar data={chartData.monthly} options={chartOptions} />
          </div>
        </motion.div>

        {/* Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
        >
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            🎯 Booking Status
          </h3>
          <div className="h-64">
            <Doughnut data={chartData.status} options={doughnutOptions} />
          </div>
        </motion.div>
      </div>

      {/* Performance Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
      >
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          🎯 Performance Insights
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Peak Hours */}
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl">
            <div className="text-2xl mb-2">⏰</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Peak Hours</div>
            <div className="font-bold text-blue-600 dark:text-blue-400">2:00 PM - 5:00 PM</div>
          </div>

          {/* Average Session */}
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl">
            <div className="text-2xl mb-2">⏱️</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg. Session</div>
            <div className="font-bold text-green-600 dark:text-green-400">45 minutes</div>
          </div>

          {/* Customer Return Rate */}
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl">
            <div className="text-2xl mb-2">🔄</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Return Rate</div>
            <div className="font-bold text-purple-600 dark:text-purple-400">78%</div>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="mt-8">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Bookings</h4>
          <div className="space-y-3">
            {reservations.slice(0, 5).map((reservation, index) => (
              <motion.div
                key={reservation.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {reservation.users?.full_name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {reservation.users?.full_name || 'Unknown Customer'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(reservation.date).toLocaleDateString()} at {reservation.time}
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  reservation.status === 'confirmed' 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : reservation.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {reservation.status || 'pending'}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BusinessStats;