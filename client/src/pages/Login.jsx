import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AnimatedLayout from '../components/AnimatedLayout';
import API from '../utils/api'; // Import the custom API instance

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await API.post('/auth/login', {
        email,
        password,
      });
      console.log('Login successful, response:', response.data);
      console.log('Attempting to navigate to /');
      navigate('/'); // Redirect to home or dashboard after successful login
    } catch (err) {
      console.error('Login error:', err.response?.data || err);
      setError(err.response?.data?.error || 'An error occurred during login.');
    }
  };

  return (
    <AnimatedLayout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-200 p-4">
      <div className="bg-white p-10 rounded-xl shadow-lg w-full max-w-md border border-gray-200">
        <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-8">Welcome Back!</h2>
        {error && <p className="text-red-600 text-center mb-6 bg-red-100 p-3 rounded-md">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label htmlFor="email" className="block text-gray-700 text-sm font-semibold mb-2">Email Address:</label>
            <input
              type="email"
              id="email"
              className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm font-semibold mb-2">Password:</label>
            <input
              type="password"
              id="password"
              className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-800 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Link to="#" className="inline-block align-baseline font-medium text-sm text-blue-500 hover:text-blue-800 float-right">Forgot Password?</Link>
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline w-full transform transition duration-200 ease-in-out hover:scale-105"
          >
            Sign In
          </button>
        </form>
        <p className="text-center text-gray-600 text-sm mt-6">
          Don't have an account? <Link to="/register" className="text-blue-600 hover:text-blue-800 font-bold">Sign Up</Link>
        </p>
      </div>
      </div>
    </AnimatedLayout>
  );
}

export default Login; 