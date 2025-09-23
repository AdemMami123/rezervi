import React from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

const UsageTracker = ({ compact = false, showUpgrade = true }) => {
  const { currentPlan, usageStats, plans, upgradePlan } = useSubscription();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const getUsagePercentage = (used, limit) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage) => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const UsageBar = ({ label, used, limit, icon }) => {
    const percentage = getUsagePercentage(used, limit);
    const colorClass = getUsageColor(percentage);

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-gray-600 dark:text-gray-400">{icon}</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </span>
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {limit === -1 ? `${used} / Unlimited` : `${used} / ${limit}`}
          </span>
        </div>
        {limit !== -1 && (
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${colorClass}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
        {limit !== -1 && percentage >= 90 && (
          <p className="text-xs text-red-600 dark:text-red-400">
            ⚠️ {percentage >= 100 ? 'Limit reached!' : 'Approaching limit'}
          </p>
        )}
      </div>
    );
  };

  if (compact) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Usage ({currentPlan.name})
          </h3>
          {currentPlan.id !== 'enterprise' && showUpgrade && (
            <button
              onClick={() => navigate('/subscription')}
              className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
            >
              Upgrade
            </button>
          )}
        </div>
        
        <div className="space-y-3">
          <UsageBar
            label="Bookings"
            used={usageStats.bookingsThisMonth}
            limit={currentPlan.features.maxBookingsPerMonth}
            icon="📅"
          />
          
          <UsageBar
            label="Businesses"
            used={usageStats.businessCount}
            limit={currentPlan.features.maxBusinesses}
            icon="🏢"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Usage Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Current Plan: <span className="font-semibold">{currentPlan.name}</span>
            <span className="ml-2 text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {(currentPlan.features.commissionRate * 100).toFixed(1)}% commission
            </span>
          </p>
        </div>
        {currentPlan.id !== 'enterprise' && showUpgrade && (
          <button
            onClick={() => navigate('/subscription')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Upgrade Plan
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <UsageBar
          label="Monthly Bookings"
          used={usageStats.bookingsThisMonth}
          limit={currentPlan.features.maxBookingsPerMonth}
          icon="📅"
        />
        
        <UsageBar
          label="Business Locations"
          used={usageStats.businessCount}
          limit={currentPlan.features.maxBusinesses}
          icon="🏢"
        />
      </div>

      {/* Revenue Stats */}
      <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Revenue Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 dark:bg-green-900 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-2xl mr-3">💰</span>
              <div>
                <p className="text-sm text-green-700 dark:text-green-300">Total Revenue</p>
                <p className="text-xl font-bold text-green-800 dark:text-green-200">
                  ${usageStats.totalRevenue.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🏦</span>
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300">Commission Earned</p>
                <p className="text-xl font-bold text-blue-800 dark:text-blue-200">
                  ${usageStats.commissionEarned.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-2xl mr-3">📊</span>
              <div>
                <p className="text-sm text-purple-700 dark:text-purple-300">Avg. Per Booking</p>
                <p className="text-xl font-bold text-purple-800 dark:text-purple-200">
                  ${usageStats.bookingsThisMonth > 0 
                    ? (usageStats.totalRevenue / usageStats.bookingsThisMonth).toFixed(2) 
                    : '0.00'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Benefits */}
      <div className="border-t border-gray-200 dark:border-gray-600 pt-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Current Plan Benefits
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
              currentPlan.features.smsNotifications ? 'bg-green-100 dark:bg-green-800' : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              <span className="text-xl">{currentPlan.features.smsNotifications ? '✅' : '❌'}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">SMS Notifications</p>
          </div>
          
          <div className="text-center">
            <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
              currentPlan.features.analytics ? 'bg-green-100 dark:bg-green-800' : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              <span className="text-xl">{currentPlan.features.analytics ? '✅' : '❌'}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Analytics</p>
          </div>
          
          <div className="text-center">
            <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
              currentPlan.features.premiumListing ? 'bg-green-100 dark:bg-green-800' : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              <span className="text-xl">{currentPlan.features.premiumListing ? '✅' : '❌'}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Premium Listing</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full mx-auto mb-2 flex items-center justify-center">
              <span className="text-xl">📞</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">24/7 Support</p>
          </div>
        </div>
      </div>

      {/* Upgrade Suggestions */}
      {(usageStats.bookingsThisMonth / currentPlan.features.maxBookingsPerMonth > 0.8 || 
        usageStats.businessCount / currentPlan.features.maxBusinesses > 0.8) && (
        <div className="border-t border-gray-200 dark:border-gray-600 pt-6 mt-6">
          <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
            <div className="flex items-start">
              <span className="text-2xl mr-3">⚡</span>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  Consider Upgrading
                </h4>
                <p className="text-yellow-700 dark:text-yellow-300 mb-3">
                  You're approaching your plan limits. Upgrade to get more capacity and lower commission rates!
                </p>
                <button
                  onClick={() => navigate('/subscription')}
                  className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors"
                >
                  View Upgrade Options
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsageTracker;
