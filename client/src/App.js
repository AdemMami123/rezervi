import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Login from './pages/Login';
import Register from './pages/Register';
import NewHome from './pages/NewHome';
import RegisterBusiness from './pages/RegisterBusiness';
import BusinessDashboard from './pages/BusinessDashboard';
import MyBusiness from './pages/MyBusiness';
import BusinessDiscovery from './pages/BusinessDiscovery';
import BookingPage from './pages/BookingPage';
import SubscriptionPage from './pages/SubscriptionPage';
import ProfilePage from './pages/ProfilePage';
import CommissionDashboard from './components/CommissionDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { ThemeProvider } from './contexts/ThemeContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import AuthForm from './components/AuthForm'; // Add this for testing

// AnimatedRoutes component to handle route transitions
function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/test-auth" element={<AuthForm />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/discover" element={<BusinessDiscovery />} />
        <Route path="/booking/:businessId" element={<BookingPage />} />
        <Route path="/profile" element={<NewHome />} /> {/* Redirect profile to home with profile section */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <NewHome />
            </ProtectedRoute>
          }
        />
      <Route
        path="/register-business"
        element={
          <ProtectedRoute>
            <RegisterBusiness />
          </ProtectedRoute>
        }
      />
      <Route
        path="/business-dashboard"
        element={
          <ProtectedRoute>
            <BusinessDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-business"
        element={
          <ProtectedRoute>
            <MyBusiness />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/subscription"
        element={
          <ProtectedRoute>
            <SubscriptionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/commission-analytics"
        element={
          <ProtectedRoute>
            <CommissionDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ThemeProvider>
      <SubscriptionProvider>
        <Router>
          <AnimatedRoutes />
        </Router>
      </SubscriptionProvider>
    </ThemeProvider>
  );
}

export default App;