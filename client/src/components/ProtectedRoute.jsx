import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import API from '../utils/api';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('ProtectedRoute: Running auth check...');
    const checkAuth = async () => {
      try {
        console.log('ProtectedRoute: Making API call to /auth/me...');
        const response = await API.get('/auth/me');
        console.log('ProtectedRoute: /auth/me successful, user data:', response.data);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('ProtectedRoute: /auth/me failed:', error.response?.data || error);
        setIsAuthenticated(false);
      } finally {
        console.log('ProtectedRoute: Auth check finished, isAuthenticated:', isAuthenticated);
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) {
    console.log('ProtectedRoute: Loading state...');
    return <div>Loading...</div>; // Or a more sophisticated loading spinner
  }

  if (!isAuthenticated) {
    console.log('ProtectedRoute: Not authenticated, redirecting to /login...');
    return <Navigate to="/login" replace />;
  }

  console.log('ProtectedRoute: Authenticated, rendering children.');
  return children;
};

export default ProtectedRoute; 