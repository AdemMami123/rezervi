import React, { useState, useEffect } from 'react';
import StarRating from './StarRating';
import API from '../utils/api';

const ReviewsList = ({ businessId, onReviewUpdate }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    console.log('ReviewsList businessId:', businessId); // Debug log
    if (businessId) {
      fetchReviews();
    } else {
      console.warn('No businessId provided to ReviewsList');
      setError('Business ID not provided');
      setLoading(false);
    }
  }, [businessId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      console.log('Fetching reviews for business:', businessId); // Debug log
      const response = await API.get(`/api/reviews/business/${businessId}?limit=50`);
      console.log('Reviews response:', response.data); // Debug log
      setReviews(response.data.reviews || []);
      setStats(response.data.stats || {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      });
      
      // Notify parent component about the updated rating
      if (onReviewUpdate) {
        onReviewUpdate({
          averageRating: response.data.stats.averageRating,
          totalReviews: response.data.stats.totalReviews
        });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      console.error('Error details:', error.response?.data); // More detailed error logging
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDisplayedReviews = () => {
    return showAll ? reviews : reviews.slice(0, 3);
  };

  const getRatingBarWidth = (count) => {
    if (stats.totalReviews === 0) return 0;
    return (count / stats.totalReviews) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading reviews...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={fetchReviews}
          className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reviews Summary */}
      {stats.totalReviews > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <StarRating rating={stats.averageRating} readonly showValue size="lg" />
              <span className="text-sm text-gray-600">
                ({stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''})
              </span>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center space-x-2 text-sm">
                <span className="w-8 text-gray-600">{rating}★</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getRatingBarWidth(stats.ratingDistribution[rating])}%` }}
                  ></div>
                </div>
                <span className="w-8 text-gray-600 text-right">
                  {stats.ratingDistribution[rating]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Individual Reviews */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📝</div>
            <h3 className="text-lg font-medium text-gray-700 mb-1">No reviews yet</h3>
            <p className="text-sm">Be the first to share your experience!</p>
          </div>
        ) : (
          <>
            {getDisplayedReviews().map((review) => (
              <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                <div className="flex items-start space-x-3">
                  {/* User Avatar */}
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {(review.user_email?.charAt(0) || review.users?.full_name?.charAt(0) || 'U').toUpperCase()}
                  </div>
                  
                  {/* Review Content */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-bold text-white text-lg">
                          {review.user_email || review.users?.full_name || 'Anonymous User'}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <StarRating rating={review.rating} readonly size="sm" />
                          <span className="text-sm text-gray-300 font-medium">
                            {formatDate(review.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Review Comment */}
                    {review.comment && review.comment.trim() && (
                      <p className="text-white text-base leading-relaxed mt-3 font-medium">
                        {review.comment}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Show More/Less Button */}
            {reviews.length > 3 && (
              <div className="text-center pt-2">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {showAll 
                    ? `Show less reviews` 
                    : `Show ${reviews.length - 3} more reviews`
                  }
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReviewsList;