import React from 'react';
import { useNavigate } from 'react-router-dom';
import SubscriptionPlans from '../components/SubscriptionPlans';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

const SubscriptionPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="text-sm sm:text-base"
              >
                ← Back to Dashboard
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Subscription Plans
              </h1>
            </div>
            <Button
              onClick={() => navigate('/business-dashboard')}
              className="text-sm sm:text-base"
            >
              Business Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        <SubscriptionPlans />
      </div>
    </div>
  );
};

export default SubscriptionPage;
