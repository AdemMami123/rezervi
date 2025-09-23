import React, { useState, useEffect } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

const CommissionDashboard = () => {
  const { currentPlan, usageStats } = useSubscription();
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  // Mock data for demonstration - in a real app this would come from an API
  const [commissionData, setCommissionData] = useState({
    thisMonth: {
      totalRevenue: 2450.75,
      commissionEarned: 73.52,
      bookingsProcessed: 28,
      averageBookingValue: 87.53
    },
    lastMonth: {
      totalRevenue: 1890.25,
      commissionEarned: 56.71,
      bookingsProcessed: 22,
      averageBookingValue: 85.92
    },
    thisYear: {
      totalRevenue: 18950.00,
      commissionEarned: 568.50,
      bookingsProcessed: 215,
      averageBookingValue: 88.14
    },
    monthlyData: [
      { month: 'Jan', revenue: 1250.00, commission: 37.50, bookings: 15 },
      { month: 'Feb', revenue: 1680.25, commission: 50.41, bookings: 19 },
      { month: 'Mar', revenue: 2100.75, commission: 63.02, bookings: 24 },
      { month: 'Apr', revenue: 1890.25, commission: 56.71, bookings: 22 },
      { month: 'May', revenue: 2450.75, commission: 73.52, bookings: 28 }
    ],
    paymentMethods: [
      { method: 'Credit Card', percentage: 65, amount: 1593.49 },
      { method: 'PayPal', percentage: 25, amount: 612.69 },
      { method: 'Bank Transfer', percentage: 10, amount: 245.07 }
    ]
  });

  const calculateGrowth = (current, previous) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const StatCard = ({ title, value, change, icon, prefix = '', suffix = '', isPositive = true }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {prefix}{value}{suffix}
          </p>
          {change && (
            <p className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'} flex items-center mt-1`}>
              <span className="mr-1">{isPositive ? '↗️' : '↘️'}</span>
              {Math.abs(change)}% from last month
            </p>
          )}
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/business-dashboard')}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Commission Analytics
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Current Plan: <span className="font-semibold text-purple-600">{currentPlan.name}</span>
              </span>
              <button
                onClick={() => navigate('/subscription')}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Upgrade Plan
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Revenue (This Month)"
            value={commissionData.thisMonth.totalRevenue.toFixed(2)}
            change={calculateGrowth(commissionData.thisMonth.totalRevenue, commissionData.lastMonth.totalRevenue)}
            icon="💰"
            prefix="$"
          />
          <StatCard
            title="Commission Earned"
            value={commissionData.thisMonth.commissionEarned.toFixed(2)}
            change={calculateGrowth(commissionData.thisMonth.commissionEarned, commissionData.lastMonth.commissionEarned)}
            icon="🏦"
            prefix="$"
          />
          <StatCard
            title="Bookings Processed"
            value={commissionData.thisMonth.bookingsProcessed}
            change={calculateGrowth(commissionData.thisMonth.bookingsProcessed, commissionData.lastMonth.bookingsProcessed)}
            icon="📅"
          />
          <StatCard
            title="Average Booking Value"
            value={commissionData.thisMonth.averageBookingValue.toFixed(2)}
            change={calculateGrowth(commissionData.thisMonth.averageBookingValue, commissionData.lastMonth.averageBookingValue)}
            icon="📊"
            prefix="$"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Revenue Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Monthly Revenue & Commission
            </h3>
            <div className="space-y-4">
              {commissionData.monthlyData.map((month, index) => (
                <div key={month.month} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-8">
                      {month.month}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="bg-blue-100 dark:bg-blue-800 rounded-full px-3 py-1">
                          <span className="text-xs text-blue-800 dark:text-blue-200">
                            ${month.revenue.toFixed(0)} revenue
                          </span>
                        </div>
                        <div className="bg-green-100 dark:bg-green-800 rounded-full px-3 py-1">
                          <span className="text-xs text-green-800 dark:text-green-200">
                            ${month.commission.toFixed(2)} commission
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {month.bookings} bookings
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Payment Methods Distribution
            </h3>
            <div className="space-y-4">
              {commissionData.paymentMethods.map((method, index) => (
                <div key={method.method}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {method.method}
                    </span>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        ${method.amount.toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        ({method.percentage}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${method.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Commission Rate Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Commission Rate Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {(currentPlan.features.commissionRate * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Current Rate</div>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                ${(commissionData.thisMonth.totalRevenue * currentPlan.features.commissionRate).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Monthly Commission</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                ${(commissionData.thisYear.totalRevenue * currentPlan.features.commissionRate).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Yearly Projection</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {currentPlan.id === 'free' ? '5.0' : 
                 currentPlan.id === 'basic' ? '2.0' : 
                 currentPlan.id === 'pro' ? '1.5' : '1.0'}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {currentPlan.id === 'enterprise' ? 'Lowest Rate!' : 'Upgrade to save'}
              </div>
            </div>
          </div>
        </div>

        {/* Savings Calculator */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-lg p-6 text-white">
          <h3 className="text-xl font-semibold mb-4">💰 Potential Savings Calculator</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold">
                ${((commissionData.thisMonth.totalRevenue * 0.05) - commissionData.thisMonth.commissionEarned).toFixed(2)}
              </div>
              <div className="text-sm opacity-90">Monthly savings vs Free plan</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                ${((commissionData.thisYear.totalRevenue * 0.05) - (commissionData.thisYear.totalRevenue * currentPlan.features.commissionRate)).toFixed(2)}
              </div>
              <div className="text-sm opacity-90">Yearly savings vs Free plan</div>
            </div>
            <div className="text-center">
              <button
                onClick={() => navigate('/subscription')}
                className="bg-white text-purple-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommissionDashboard;
