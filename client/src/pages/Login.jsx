import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMail, 
  FiLock, 
  FiEye, 
  FiEyeOff, 
  FiUser,
  FiArrowRight,
  FiCheckCircle,
  FiAlertCircle
} from 'react-icons/fi';
import AnimatedLayout from '../components/AnimatedLayout';
import API from '../utils/api'; // Import the custom API instance

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      const response = await API.post('/auth/login', {
        email,
        password,
      });
      console.log('Login successful, response:', response.data);
      console.log('Attempting to navigate to /');
      
      // Small delay to show success state before navigation
      setTimeout(() => {
        navigate('/'); // Redirect to home or dashboard after successful login
      }, 500);
    } catch (err) {
      console.error('Login error:', err.response?.data || err);
      setError(err.response?.data?.error || 'An error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatedLayout>
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          {/* Floating geometric shapes - responsive positioning */}
          <motion.div
            className="absolute top-10 sm:top-20 left-4 sm:left-20 w-20 sm:w-32 h-20 sm:h-32 bg-blue-500 opacity-10 rounded-full blur-xl"
            animate={{
              x: [0, 50, 0],
              y: [0, -50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute top-20 sm:top-40 right-4 sm:right-32 w-16 sm:w-24 h-16 sm:h-24 bg-purple-500 opacity-10 rounded-full blur-xl"
            animate={{
              x: [0, -40, 0],
              y: [0, 60, 0],
              scale: [1, 0.8, 1],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          />
          <motion.div
            className="absolute bottom-10 sm:bottom-20 left-1/4 sm:left-1/3 w-24 sm:w-40 h-24 sm:h-40 bg-pink-500 opacity-10 rounded-full blur-xl"
            animate={{
              x: [0, 60, 0],
              y: [0, -40, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 4
            }}
          />
        </div>

        {/* Login Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 w-full max-w-md mx-4 px-4 sm:px-0"
        >
          <motion.div
            className="bg-white/10 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl"
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {/* Logo/Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex justify-center mb-8"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                <FiUser className="text-white text-2xl" />
              </div>
            </motion.div>

            {/* Welcome Text */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-8"
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Welcome Back!</h2>
              <p className="text-white/70 text-sm sm:text-base">Sign in to your account to continue</p>
            </motion.div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: "auto" }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  className="mb-6"
                >
                  <div className="bg-red-500/20 border border-red-400/30 text-red-100 p-4 rounded-xl flex items-center gap-3 backdrop-blur-sm">
                    <FiAlertCircle className="flex-shrink-0 text-red-400" />
                    <span className="text-sm">{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label htmlFor="email" className="block text-white/90 text-sm font-medium mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50" />
                  <input
                    type="email"
                    id="email"
                    className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-12 pr-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </motion.div>

              {/* Password Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label htmlFor="password" className="block text-white/90 text-sm font-medium mb-2">
                  Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-12 pr-12 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                <div className="flex justify-end mt-2">
                  <Link
                    to="#"
                    className="text-blue-300 hover:text-blue-200 text-sm transition-colors duration-200"
                  >
                    Forgot Password?
                  </Link>
                </div>
              </motion.div>

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Signing In...
                    </>
                  ) : (
                    <>
                      Sign In
                      <FiArrowRight className="transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </motion.button>
              </motion.div>
            </form>

            {/* Register Link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-center mt-8"
            >
              <p className="text-white/70">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="text-blue-300 hover:text-blue-200 font-semibold transition-colors duration-200 hover:underline"
                >
                  Create Account
                </Link>
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </AnimatedLayout>
  );
}

export default Login; 