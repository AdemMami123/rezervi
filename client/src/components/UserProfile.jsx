import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { authAPI } from '../api/auth';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiCalendar, FiEdit, FiSave, FiXCircle, FiCamera } from 'react-icons/fi';
import BusinessDeleteModal from './BusinessDeleteModal';
import API from '../utils/api';

const UserProfile = ({ user, onProfileUpdate, business }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    phone_number: user?.phone_number || '',
    birthday: user?.birthday || '',
  });
  const [previewUrl, setPreviewUrl] = useState(user?.profile_picture_url || null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || '',
        phone_number: user.phone_number || '',
        birthday: user.birthday || '',
      });
      setPreviewUrl(user.profile_picture_url || null);
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image size should not exceed 2MB');
      return;
    }

    setError(null);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const updates = {};
      
      if (profileData.username && profileData.username.trim() !== user?.username) {
        updates.username = profileData.username.trim();
      }
      if (profileData.phone_number && profileData.phone_number.trim() !== user?.phone_number) {
        updates.phone_number = profileData.phone_number.trim();
      }
      if (profileData.birthday && profileData.birthday !== user?.birthday) {
        updates.birthday = profileData.birthday;
      }

      if (Object.keys(updates).length > 0) {
        await authAPI.updateProfile(updates);
      }
      
      if (fileInputRef.current && fileInputRef.current.files[0]) {
        await authAPI.uploadProfilePicture(fileInputRef.current.files[0]);
      }

      setIsEditing(false);
      
      if (onProfileUpdate) {
        onProfileUpdate();
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setProfileData({
      username: user?.username || '',
      phone_number: user?.phone_number || '',
      birthday: user?.birthday || '',
    });
    setPreviewUrl(user?.profile_picture_url || null);
    setIsEditing(false);
    setError(null);
  };

  const handleBusinessDeleted = () => {
    setShowDeleteModal(false);
    // Refresh profile to update business status
    if (onProfileUpdate) {
      onProfileUpdate();
    }
    // Redirect to home or show success message
    navigate('/');
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const memberSince = user?.created_at 
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Profile Information
            </h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <FiEdit className="mr-2" />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid md:grid-cols-3 gap-8">
            {/* Profile Picture Section */}
            <div className="md:col-span-1 flex flex-col items-center">
              <div 
                className="relative w-40 h-40 mb-4 rounded-full overflow-hidden border-4 border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 group"
                onClick={isEditing ? triggerFileInput : undefined}
                style={{ cursor: isEditing ? 'pointer' : 'default' }}
              >
                {previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-6xl">
                    <FiUser />
                  </div>
                )}
                {isEditing && (
                  <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <FiCamera className="text-white text-3xl" />
                  </div>
                )}
              </div>
              {isEditing && (
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              )}
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mt-2">
                {user?.username || 'User'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
            </div>

            {/* User Details Section */}
            <div className="md:col-span-2 space-y-6">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FiUser className="mr-2" /> Username
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="username"
                    value={profileData.username}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    pattern="^[a-zA-Z0-9_-]{3,30}$"
                    title="Username must be 3-30 characters, alphanumeric, underscore or hyphen"
                  />
                ) : (
                  <p className="py-3 px-4 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-800 dark:text-gray-200">
                    {user?.username || 'Not provided'}
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FiMail className="mr-2" /> Email Address
                </label>
                <p className="py-3 px-4 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-800 dark:text-gray-200">
                  {user?.email}
                </p>
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FiUser className="mr-2" /> Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone_number"
                    value={profileData.phone_number}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    pattern="^\+?[0-9\s\-\(\)]{8,15}$"
                    title="Phone number must be 8-15 digits"
                  />
                ) : (
                  <p className="py-3 px-4 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-800 dark:text-gray-200">
                    {user?.phone_number || 'Not provided'}
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FiCalendar className="mr-2" /> Birthday
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    name="birthday"
                    value={profileData.birthday}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="py-3 px-4 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-800 dark:text-gray-200">
                    {user?.birthday ? new Date(user.birthday).toLocaleDateString() : 'Not provided'}
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FiCalendar className="mr-2" /> Member Since
                </label>
                <p className="py-3 px-4 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-800 dark:text-gray-200">
                  {memberSince}
                </p>
              </div>

              {isEditing && (
                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors font-medium"
                    disabled={loading}
                  >
                    <FiXCircle className="mr-2" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
                    disabled={loading}
                  >
                    <FiSave className="mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Business Management Section - Only show if user has a business */}
      {business && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-red-50/90 dark:bg-red-900/20 rounded-lg shadow-xl border-2 border-red-200/50 dark:border-red-800/50 overflow-hidden mt-6"
        >
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-red-800 dark:text-red-200 flex items-center gap-3">
                  <span className="text-3xl">⚠️</span>
                  Business Management
                </h3>
                <p className="text-red-700 dark:text-red-300 mt-1 text-sm">
                  Manage or delete your business from here
                </p>
              </div>
            </div>

            {/* Business Info Card */}
            <div className="bg-white dark:bg-red-900/30 rounded-xl p-6 border border-red-200 dark:border-red-800 mb-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Your Business
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Name:</span> {business.name}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Type:</span> {business.type?.replace('_', ' ')}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Location:</span> {business.location}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/my-business')}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Manage Business
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white dark:bg-red-900/30 rounded-xl p-6 border border-red-300 dark:border-red-800">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                    Delete Business
                  </h4>
                  <p className="text-red-700 dark:text-red-300 text-sm mb-4">
                    Permanently delete your business and all associated data including reservations, 
                    photos, and customer information. This action cannot be undone.
                  </p>
                  <ul className="text-red-600 dark:text-red-400 text-xs space-y-1 ml-4 list-disc">
                    <li>All business information will be permanently deleted</li>
                    <li>All reservations and booking history will be lost</li>
                    <li>All uploaded photos will be removed</li>
                    <li>Customer data and reviews will be deleted</li>
                  </ul>
                </div>
                <div className="ml-6 flex-shrink-0">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowDeleteModal(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 border-2 border-red-700"
                  >
                    <span>🗑️</span>
                    Delete Business
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Business Delete Modal */}
      <BusinessDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        business={business}
        onDeleted={handleBusinessDeleted}
      />
    </motion.div>
  );
};

export default UserProfile;