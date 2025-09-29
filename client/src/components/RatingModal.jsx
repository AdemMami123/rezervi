import React, { useState, useEffect } from 'react';
import StarRating from './StarRating';
import API from '../utils/api';

const RatingModal = ({ 
  isOpen, 
  onClose, 
  businessId, 
  businessName, 
  onReviewSubmitted,
  existingReview = null 
}) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment || '');
    }
  }, [existingReview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let response;
      if (existingReview) {
        // Update existing review
        response = await API.put(`/api/reviews/${existingReview.id}`, {
          rating,
          comment: comment.trim()
        });
      } else {
        // Submit new review
        response = await API.post('/api/reviews/submit', {
          business_id: businessId,
          rating,
          comment: comment.trim()
        });
      }

      setSuccess(true);
      setTimeout(() => {
        onReviewSubmitted && onReviewSubmitted(response.data.review);
        handleClose();
      }, 1500);
      
    } catch (error) {
      console.error('Error submitting review:', error);
      setError(error.response?.data?.error || 'Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setRating(existingReview?.rating || 0);
      setComment(existingReview?.comment || '');
      setError('');
      setSuccess(false);
      onClose();
    }
  };

  const handleRatingChange = (newRating) => {
    setRating(newRating);
    setError(''); // Clear error when rating is selected
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-90vh overflow-y-auto"
           onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {existingReview ? 'Update Your Review' : 'Rate Your Experience'}
            </h2>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Business Name */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800">{businessName}</h3>
            <p className="text-sm text-gray-600">
              {existingReview ? 'Update your review and rating' : 'How was your experience?'}
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {existingReview ? 'Review updated successfully!' : 'Review submitted successfully!'}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Rating Form */}
          <form onSubmit={handleSubmit}>
            {/* Star Rating */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Your Rating *
              </label>
              <div className="flex items-center space-x-2">
                <StarRating
                  rating={rating}
                  onRatingChange={handleRatingChange}
                  size="lg"
                />
                {rating > 0 && (
                  <span className="text-sm text-gray-600 ml-2">
                    ({rating} star{rating !== 1 ? 's' : ''})
                  </span>
                )}
              </div>
            </div>

            {/* Comment */}
            <div className="mb-6">
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                Your Review (Optional)
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with others..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
                maxLength={500}
                disabled={loading}
              />
              <div className="mt-1 text-right">
                <span className={`text-xs ${comment.length > 450 ? 'text-red-500' : 'text-gray-500'}`}>
                  {comment.length}/500 characters
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || rating === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {existingReview ? 'Updating...' : 'Submitting...'}
                  </>
                ) : (
                  existingReview ? 'Update Review' : 'Submit Review'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;