import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import UserProfile from '../components/UserProfile';
import { authAPI } from '../api/auth';
import { useNavigate } from 'react-router-dom';
import AnimatedLayout from '../components/AnimatedLayout';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const userData = await authAPI.getMe();
      setUser(userData);
      setError(null);
    } catch (err) {
      setError('Failed to load profile data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const handleProfileUpdate = () => {
    // Refresh user data after update
    fetchUserProfile();
  };

  if (loading) {
    return (
      <AnimatedLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </AnimatedLayout>
    );
  }

  if (error) {
    return (
      <AnimatedLayout>
        <div className="flex flex-col items-center justify-center h-screen">
          <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4">
            {error}
          </div>
          <button 
            onClick={fetchUserProfile}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </AnimatedLayout>
    );
  }

  return (
    <AnimatedLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800 dark:text-white">
          My Profile
        </h1>
        
        {user && (
          <UserProfile 
            user={user} 
            onProfileUpdate={handleProfileUpdate} 
          />
        )}
      </div>
    </AnimatedLayout>
  );
};

export default ProfilePage;