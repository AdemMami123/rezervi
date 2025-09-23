import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { authAPI } from '../api/auth';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiCalendar, FiEdit, FiSave, FiXCircle, FiCamera } from 'react-icons/fi';

const UserProfile = ({ user, onProfileUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
  });
  const [previewUrl, setPreviewUrl] = useState(user?.profile_picture_url || null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || '',
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
      if (!profileData.full_name || profileData.full_name.trim() === '') {
        throw new Error('Full name is required');
      }

      await authAPI.updateProfile({
        full_name: profileData.full_name.trim()
      });
      
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
      full_name: user?.full_name || '',
    });
    setPreviewUrl(user?.profile_picture_url || null);
    setIsEditing(false);
    setError(null);
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
                {user?.full_name || 'User'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
            </div>

            {/* User Details Section */}
            <div className="md:col-span-2 space-y-6">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FiUser className="mr-2" /> Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="full_name"
                    value={profileData.full_name}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                ) : (
                  <p className="py-3 px-4 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-800 dark:text-gray-200">
                    {user?.full_name || 'Not provided'}
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
    </motion.div>
  );
};

export default UserProfile;