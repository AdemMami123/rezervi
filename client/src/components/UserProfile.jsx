import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { authAPI } from '../api/auth';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiCalendar, FiEdit, FiSave, FiXCircle, FiCamera } from 'react-icons/fi';
import BusinessDeleteModal from './BusinessDeleteModal';
import API from '../utils/api';
import { cn } from '../utils/cn';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';

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
      <Card className="shadow-2xl border-2">
        <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Profile Information
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Manage your account details and preferences
              </CardDescription>
            </div>
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <FiEdit className="mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid md:grid-cols-3 gap-8">
            {/* Profile Picture Section */}
            <div className="md:col-span-1 flex flex-col items-center">
              <div 
                className="relative mb-4 group"
                onClick={isEditing ? triggerFileInput : undefined}
                style={{ cursor: isEditing ? 'pointer' : 'default' }}
              >
                <Avatar className="w-40 h-40 border-4 border-primary/20 shadow-2xl ring-4 ring-background">
                  <AvatarImage src={previewUrl} alt={user?.username} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-5xl">
                    <FiUser />
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
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
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <Badge variant="secondary" className="mt-2">
                <FiCalendar className="mr-1 h-3 w-3" />
                Member since {memberSince}
              </Badge>
            </div>

            {/* User Details Section */}
            <div className="md:col-span-2 space-y-6">
              <div>
                <Label className="flex items-center mb-2">
                  <FiUser className="mr-2" /> Username
                </Label>
                {isEditing ? (
                  <Input
                    type="text"
                    name="username"
                    value={profileData.username}
                    onChange={handleInputChange}
                    pattern="^[a-zA-Z0-9_-]{3,30}$"
                    title="Username must be 3-30 characters, alphanumeric, underscore or hyphen"
                  />
                ) : (
                  <p className="py-3 px-4 bg-muted rounded-md text-foreground">
                    {user?.username || 'Not provided'}
                  </p>
                )}
              </div>

              <div>
                <Label className="flex items-center mb-2">
                  <FiMail className="mr-2" /> Email Address
                </Label>
                <p className="py-3 px-4 bg-muted rounded-md text-foreground">
                  {user?.email}
                </p>
              </div>

              <div>
                <Label className="flex items-center mb-2">
                  <FiUser className="mr-2" /> Phone Number
                </Label>
                {isEditing ? (
                  <Input
                    type="tel"
                    name="phone_number"
                    value={profileData.phone_number}
                    onChange={handleInputChange}
                    pattern="^\+?[0-9\s\-\(\)]{8,15}$"
                    title="Phone number must be 8-15 digits"
                  />
                ) : (
                  <p className="py-3 px-4 bg-muted rounded-md text-foreground">
                    {user?.phone_number || 'Not provided'}
                  </p>
                )}
              </div>

              <div>
                <Label className="flex items-center mb-2">
                  <FiCalendar className="mr-2" /> Birthday
                </Label>
                {isEditing ? (
                  <Input
                    type="date"
                    name="birthday"
                    value={profileData.birthday}
                    onChange={handleInputChange}
                  />
                ) : (
                  <p className="py-3 px-4 bg-muted rounded-md text-foreground">
                    {user?.birthday ? new Date(user.birthday).toLocaleDateString() : 'Not provided'}
                  </p>
                )}
              </div>

              <div>
                <Label className="flex items-center mb-2">
                  <FiCalendar className="mr-2" /> Member Since
                </Label>
                <p className="py-3 px-4 bg-muted rounded-md text-foreground">
                  {memberSince}
                </p>
              </div>

              {isEditing && (
                <div className="flex justify-end space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    <FiXCircle className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    <FiSave className="mr-2 h-4 w-4" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Business Management Section - Only show if user has a business */}
      {business && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <Card className="bg-red-50/90 dark:bg-red-900/20 border-2 border-red-200/50 dark:border-red-800/50 shadow-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl text-red-800 dark:text-red-200 flex items-center gap-3">
                    <span className="text-3xl">⚠️</span>
                    Business Management
                  </CardTitle>
                  <CardDescription className="text-red-700 dark:text-red-300 mt-1">
                    Manage or delete your business from here
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Business Info Card */}
              <Card className="bg-background/50 border-red-200 dark:border-red-800">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold mb-2">
                        Your Business
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">Name:</span> {business.name}
                        </p>
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">Type:</span> {business.type?.replace('_', ' ')}
                        </p>
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">Location:</span> {business.location}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => navigate('/my-business')}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                    >
                      Manage Business
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="bg-background/50 border-red-300 dark:border-red-800">
                <CardContent className="pt-6">
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
                      <Button
                        variant="destructive"
                        onClick={() => setShowDeleteModal(true)}
                        className="shadow-lg hover:shadow-xl gap-2"
                      >
                        <span>🗑️</span>
                        Delete Business
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
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