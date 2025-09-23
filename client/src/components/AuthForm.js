import { useState } from 'react';
import { motion } from 'framer-motion';
import { authAPI } from '../api/auth';

function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      let result;
      if (mode === 'login') {
        result = await authAPI.login(email, password);
        setUser(result.user);
        console.log('Login successful:', result);
      } else {
        result = await authAPI.register(email, password, fullName);
        console.log('Registration successful:', result);
        alert('Registration successful! Please check your email for verification.');
      }
    } catch (err) {
      setError(err.message);
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
      setEmail('');
      setPassword('');
      setFullName('');
      console.log('Logout successful');
    } catch (err) {
      setError(err.message);
      console.error('Logout error:', err);
    }
  };

  const handleGetProfile = async () => {
    try {
      const profile = await authAPI.getMe();
      console.log('User profile:', profile);
      alert(`Profile: ${profile.full_name} (${profile.email}) - Role: ${profile.role}`);
    } catch (err) {
      setError(err.message);
      console.error('Get profile error:', err);
    }
  };

  if (user) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-green-600">Welcome!</h2>
        <p className="mb-4">Email: {user.email}</p>
        <div className="space-y-2">
          <button
            onClick={handleGetProfile}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            Get My Profile
          </button>
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        type: "spring", 
        duration: 0.5, 
        stiffness: 300, 
        damping: 30 
      }}
    >
      <motion.h2 
        className="text-2xl font-bold mb-4 text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        {mode === 'login' ? 'Login' : 'Register'}
      </motion.h2>
      
      <motion.form 
        onSubmit={handleSubmit} 
        className="space-y-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1,
              delayChildren: 0.3
            }
          }
        }}
      >
        {mode === 'register' && (
          <motion.div
            variants={{
              hidden: { opacity: 0, x: -20 },
              visible: { opacity: 1, x: 0, transition: { duration: 0.3 } }
            }}
          >
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <motion.input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={mode === 'register'}
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            />
          </motion.div>
        )}
        
        <motion.div
          variants={{
            hidden: { opacity: 0, x: -20 },
            visible: { opacity: 1, x: 0, transition: { duration: 0.3 } }
          }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <motion.input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            whileFocus={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          />
        </motion.div>
        
        <motion.div
          variants={{
            hidden: { opacity: 0, x: -20 },
            visible: { opacity: 1, x: 0, transition: { duration: 0.3 } }
          }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <motion.input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            whileFocus={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          />
        </motion.div>
        
        {error && (
          <motion.div 
            className="text-red-500 text-sm bg-red-50 p-2 rounded"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {error}
          </motion.div>
        )}
        
        <motion.button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
          }}
        >
          {loading ? 'Loading...' : (mode === 'login' ? 'Login' : 'Register')}
        </motion.button>
        
        <motion.button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setError('');
          }}
          className="w-full text-blue-500 hover:text-blue-700 underline"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
          }}
        >
          {mode === 'login' ? 'Need an account? Register' : 'Have an account? Login'}
        </motion.button>
      </motion.form>
    </motion.div>
  );
}

export default AuthForm;
