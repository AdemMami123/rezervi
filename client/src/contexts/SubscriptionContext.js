import React, { createContext, useContext, useState, useEffect } from 'react';

const SubscriptionContext = createContext();

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

// Subscription plans configuration
export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    monthly: 0,
    features: {
      maxBookingsPerMonth: 10,
      maxBusinesses: 1,
      emailNotifications: true,
      smsNotifications: false,
      analytics: false,
      customBranding: false,
      prioritySupport: false,
      premiumListing: false,
      commissionRate: 0.05, // 5% commission
    },
    limitations: [
      'Limited to 10 bookings per month',
      'Basic email notifications only',
      'No analytics dashboard',
      'Standard listing in search results'
    ]
  },
  BASIC: {
    id: 'basic',
    name: 'Basic',
    price: 29.99,
    monthly: 29.99,
    features: {
      maxBookingsPerMonth: 100,
      maxBusinesses: 3,
      emailNotifications: true,
      smsNotifications: true,
      analytics: true,
      customBranding: false,
      prioritySupport: false,
      premiumListing: false,
      commissionRate: 0.03, // 3% commission
    },
    benefits: [
      'Up to 100 bookings per month',
      'SMS & Email notifications',
      'Basic analytics dashboard',
      'Reduced commission rate (3%)',
      'Multiple business locations'
    ]
  },
  PRO: {
    id: 'pro',
    name: 'Professional',
    price: 79.99,
    monthly: 79.99,
    features: {
      maxBookingsPerMonth: 500,
      maxBusinesses: 10,
      emailNotifications: true,
      smsNotifications: true,
      analytics: true,
      customBranding: true,
      prioritySupport: true,
      premiumListing: true,
      commissionRate: 0.025, // 2.5% commission
    },
    benefits: [
      'Up to 500 bookings per month',
      'Premium listing placement',
      'Advanced analytics & reporting',
      'Custom branding options',
      'Priority customer support',
      'Lowest commission rate (2.5%)',
      'Multiple business management'
    ]
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199.99,
    monthly: 199.99,
    features: {
      maxBookingsPerMonth: -1, // Unlimited
      maxBusinesses: -1, // Unlimited
      emailNotifications: true,
      smsNotifications: true,
      analytics: true,
      customBranding: true,
      prioritySupport: true,
      premiumListing: true,
      commissionRate: 0.02, // 2% commission
    },
    benefits: [
      'Unlimited bookings',
      'Unlimited business locations',
      'White-label solution',
      'Dedicated account manager',
      'Custom integrations',
      'Lowest commission rate (2%)',
      'API access',
      '24/7 priority support'
    ]
  }
};

export const SubscriptionProvider = ({ children }) => {
  const [currentPlan, setCurrentPlan] = useState(SUBSCRIPTION_PLANS.FREE);
  const [subscriptionStatus, setSubscriptionStatus] = useState('active'); // active, expired, cancelled
  const [usageStats, setUsageStats] = useState({
    bookingsThisMonth: 0,
    businessCount: 0,
    totalRevenue: 0,
    commissionEarned: 0
  });
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Load subscription data from API or localStorage
  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      // In a real app, this would be an API call
      const savedPlan = localStorage.getItem('subscriptionPlan');
      const savedUsage = localStorage.getItem('usageStats');
      
      if (savedPlan) {
        const planId = JSON.parse(savedPlan);
        setCurrentPlan(SUBSCRIPTION_PLANS[planId.toUpperCase()] || SUBSCRIPTION_PLANS.FREE);
      }
      
      if (savedUsage) {
        setUsageStats(JSON.parse(savedUsage));
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
    }
  };

  const upgradePlan = async (planId) => {
    try {
      // In a real app, this would integrate with Stripe/PayPal
      const newPlan = SUBSCRIPTION_PLANS[planId.toUpperCase()];
      if (!newPlan) throw new Error('Invalid plan');

      setCurrentPlan(newPlan);
      localStorage.setItem('subscriptionPlan', planId.toLowerCase());
      setShowUpgradeModal(false);
      
      return { success: true, message: `Successfully upgraded to ${newPlan.name} plan!` };
    } catch (error) {
      console.error('Error upgrading plan:', error);
      return { success: false, message: error.message };
    }
  };

  const checkUsageLimit = (type) => {
    const limits = currentPlan.features;
    
    switch (type) {
      case 'bookings':
        return limits.maxBookingsPerMonth === -1 || 
               usageStats.bookingsThisMonth < limits.maxBookingsPerMonth;
      case 'businesses':
        return limits.maxBusinesses === -1 || 
               usageStats.businessCount < limits.maxBusinesses;
      default:
        return true;
    }
  };

  const incrementUsage = (type, amount = 1) => {
    setUsageStats(prev => {
      const updated = { ...prev };
      switch (type) {
        case 'bookings':
          updated.bookingsThisMonth += amount;
          break;
        case 'businesses':
          updated.businessCount += amount;
          break;
        case 'revenue':
          updated.totalRevenue += amount;
          updated.commissionEarned += amount * currentPlan.features.commissionRate;
          break;
      }
      localStorage.setItem('usageStats', JSON.stringify(updated));
      return updated;
    });
  };

  const getUsagePercentage = (type) => {
    const limits = currentPlan.features;
    switch (type) {
      case 'bookings':
        if (limits.maxBookingsPerMonth === -1) return 0;
        return (usageStats.bookingsThisMonth / limits.maxBookingsPerMonth) * 100;
      case 'businesses':
        if (limits.maxBusinesses === -1) return 0;
        return (usageStats.businessCount / limits.maxBusinesses) * 100;
      default:
        return 0;
    }
  };

  const shouldShowUpgradePrompt = () => {
    return getUsagePercentage('bookings') > 80 || 
           getUsagePercentage('businesses') > 80 ||
           !checkUsageLimit('bookings') ||
           !checkUsageLimit('businesses');
  };

  const calculateCommission = (amount, paymentMethod = 'online') => {
    if (paymentMethod !== 'online') return 0;
    return amount * currentPlan.features.commissionRate;
  };

  const value = {
    currentPlan,
    subscriptionStatus,
    usageStats,
    showUpgradeModal,
    setShowUpgradeModal,
    upgradePlan,
    checkUsageLimit,
    incrementUsage,
    getUsagePercentage,
    shouldShowUpgradePrompt,
    calculateCommission,
    plans: SUBSCRIPTION_PLANS
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export default SubscriptionProvider;
