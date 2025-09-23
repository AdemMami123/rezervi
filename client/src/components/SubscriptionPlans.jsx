import React, { useState } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useTheme } from '../contexts/ThemeContext';

const SubscriptionPlans = ({ isModal = false, onClose = null }) => {
  const { currentPlan, upgradePlan, usageStats, plans } = useSubscription();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const handleUpgrade = async (planId) => {
    if (planId === currentPlan.id) return;
    
    setLoading(true);
    setSelectedPlan(planId);
    
    try {
      const result = await upgradePlan(planId);
      if (result.success) {
        alert(result.message);
        if (onClose) onClose();
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('Failed to upgrade plan. Please try again.');
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  const getPlanBadge = (plan) => {
    if (plan.id === currentPlan.id) {
      return (
        <span className="absolute top-4 right-4 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
          Current Plan
        </span>
      );
    }
    if (plan.id === 'pro') {
      return (
        <span className="absolute top-4 right-4 bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
          Most Popular
        </span>
      );
    }
    return null;
  };

  const PlanCard = ({ plan, isRecommended = false }) => (
    <div className={`relative rounded-lg shadow-lg p-6 ${
      isRecommended 
        ? 'border-2 border-purple-500 transform scale-105' 
        : 'border border-gray-200 dark:border-gray-600'
    } bg-white dark:bg-gray-800 transition-all duration-200 hover:shadow-xl`}>
      {getPlanBadge(plan)}
      
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {plan.name}
        </h3>
        <div className="mb-4">
          <span className="text-3xl font-bold text-gray-900 dark:text-white">
            ${plan.price}
          </span>
          {plan.price > 0 && (
            <span className="text-gray-600 dark:text-gray-400">/month</span>
          )}
        </div>
        
        {/* Commission Rate Highlight */}
        <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-3 mb-4">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
            Commission: {(plan.features.commissionRate * 100).toFixed(1)}%
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            On online payments
          </p>
        </div>

        {/* Features List */}
        <ul className="text-left space-y-2 mb-6">
          {plan.benefits ? (
            plan.benefits.map((benefit, index) => (
              <li key={index} className="flex items-start">
                <svg className="w-4 h-4 text-green-500 mt-1 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-600 dark:text-gray-400">{benefit}</span>
              </li>
            ))
          ) : (
            <>
              <li className="flex items-start">
                <svg className="w-4 h-4 text-green-500 mt-1 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {plan.features.maxBookingsPerMonth === -1 
                    ? 'Unlimited bookings' 
                    : `${plan.features.maxBookingsPerMonth} bookings/month`}
                </span>
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 text-green-500 mt-1 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {plan.features.maxBusinesses === -1 
                    ? 'Unlimited businesses' 
                    : `${plan.features.maxBusinesses} business locations`}
                </span>
              </li>
              {plan.features.smsNotifications && (
                <li className="flex items-start">
                  <svg className="w-4 h-4 text-green-500 mt-1 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-600 dark:text-gray-400">SMS notifications</span>
                </li>
              )}
              {plan.features.analytics && (
                <li className="flex items-start">
                  <svg className="w-4 h-4 text-green-500 mt-1 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Analytics dashboard</span>
                </li>
              )}
              {plan.features.premiumListing && (
                <li className="flex items-start">
                  <svg className="w-4 h-4 text-green-500 mt-1 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Premium listing</span>
                </li>
              )}
            </>
          )}
        </ul>

        <button
          onClick={() => handleUpgrade(plan.id)}
          disabled={plan.id === currentPlan.id || (loading && selectedPlan === plan.id)}
          className={`w-full py-2 px-4 rounded-md font-semibold transition-colors ${
            plan.id === currentPlan.id
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
              : isRecommended
              ? 'bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600'
              : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
          }`}
        >
          {loading && selectedPlan === plan.id ? (
            'Processing...'
          ) : plan.id === currentPlan.id ? (
            'Current Plan'
          ) : plan.price === 0 ? (
            'Downgrade to Free'
          ) : (
            `Upgrade to ${plan.name}`
          )}
        </button>
      </div>
    </div>
  );

  const content = (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Choose Your Plan
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Grow your business with our flexible pricing plans. Lower commission rates and more features as you upgrade.
        </p>
      </div>

      {/* Current Usage Stats */}
      <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-4">
          Current Usage ({currentPlan.name} Plan)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {usageStats.bookingsThisMonth}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">
              Bookings this month
              {currentPlan.features.maxBookingsPerMonth > 0 && 
                ` / ${currentPlan.features.maxBookingsPerMonth}`}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {usageStats.businessCount}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">
              Business locations
              {currentPlan.features.maxBusinesses > 0 && 
                ` / ${currentPlan.features.maxBusinesses}`}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              ${usageStats.commissionEarned.toFixed(2)}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">
              Commission earned
            </div>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <PlanCard plan={plans.FREE} />
        <PlanCard plan={plans.BASIC} />
        <PlanCard plan={plans.PRO} isRecommended={true} />
        <PlanCard plan={plans.ENTERPRISE} />
      </div>

      {/* Features Comparison */}
      <div className="mt-12">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
          Feature Comparison
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full bg-white dark:bg-gray-800 rounded-lg shadow">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-600">
                <th className="text-left p-4 font-semibold text-gray-900 dark:text-white">Feature</th>
                <th className="text-center p-4 font-semibold text-gray-900 dark:text-white">Free</th>
                <th className="text-center p-4 font-semibold text-gray-900 dark:text-white">Basic</th>
                <th className="text-center p-4 font-semibold text-gray-900 dark:text-white">Pro</th>
                <th className="text-center p-4 font-semibold text-gray-900 dark:text-white">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <td className="p-4 text-gray-600 dark:text-gray-400">Monthly Bookings</td>
                <td className="p-4 text-center">10</td>
                <td className="p-4 text-center">100</td>
                <td className="p-4 text-center">500</td>
                <td className="p-4 text-center">Unlimited</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <td className="p-4 text-gray-600 dark:text-gray-400">Commission Rate</td>
                <td className="p-4 text-center">5%</td>
                <td className="p-4 text-center">3%</td>
                <td className="p-4 text-center">2.5%</td>
                <td className="p-4 text-center">2%</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <td className="p-4 text-gray-600 dark:text-gray-400">SMS Notifications</td>
                <td className="p-4 text-center">❌</td>
                <td className="p-4 text-center">✅</td>
                <td className="p-4 text-center">✅</td>
                <td className="p-4 text-center">✅</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <td className="p-4 text-gray-600 dark:text-gray-400">Analytics Dashboard</td>
                <td className="p-4 text-center">❌</td>
                <td className="p-4 text-center">✅</td>
                <td className="p-4 text-center">✅</td>
                <td className="p-4 text-center">✅</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <td className="p-4 text-gray-600 dark:text-gray-400">Premium Listing</td>
                <td className="p-4 text-center">❌</td>
                <td className="p-4 text-center">❌</td>
                <td className="p-4 text-center">✅</td>
                <td className="p-4 text-center">✅</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-600">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Upgrade Your Plan
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl dark:text-gray-500 dark:hover:text-gray-300"
            >
              ×
            </button>
          </div>
          <div className="p-6">
            {content}
          </div>
        </div>
      </div>
    );
  }

  return content;
};

export default SubscriptionPlans;
