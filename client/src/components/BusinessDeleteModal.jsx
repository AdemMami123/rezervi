import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../utils/api';

const BusinessDeleteModal = ({ isOpen, onClose, business, onDeleted }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');

  const confirmationText = 'DELETE MY BUSINESS';

  const handleDelete = async () => {
    if (confirmText !== confirmationText) {
      setError('Please type the confirmation text exactly as shown');
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      await API.delete('/api/business/delete');
      
      // Call the onDeleted callback to handle post-deletion actions
      if (onDeleted) {
        onDeleted();
      }
      
      onClose();
    } catch (err) {
      console.error('Error deleting business:', err);
      setError(err.response?.data?.error || 'Failed to delete business. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const isConfirmationValid = confirmText === confirmationText;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <span className="text-red-600 dark:text-red-400 text-xl">⚠️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Delete Business
              </h3>
            </div>
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
            >
              ✕
            </button>
          </div>

          {/* Warning Content */}
          <div className="mb-6">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
              <p className="text-red-800 dark:text-red-200 text-sm font-medium mb-2">
                ⚠️ This action cannot be undone!
              </p>
              <p className="text-red-700 dark:text-red-300 text-sm">
                Deleting your business will permanently remove:
              </p>
              <ul className="text-red-700 dark:text-red-300 text-sm mt-2 ml-4 list-disc space-y-1">
                <li>All business information and settings</li>
                <li>All reservations and booking history</li>
                <li>All uploaded photos</li>
                <li>All customer data and reviews</li>
              </ul>
            </div>

            <div className="mb-4">
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                Business to be deleted:
              </p>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {business?.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {business?.type?.replace('_', ' ')} • {business?.location}
                </p>
              </div>
            </div>

            {/* Confirmation Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type "{confirmationText}" to confirm deletion:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => {
                  setConfirmText(e.target.value);
                  setError('');
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                placeholder={confirmationText}
                disabled={isDeleting}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={!isConfirmationValid || isDeleting}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Deleting...
                </>
              ) : (
                'Delete Business'
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BusinessDeleteModal;
