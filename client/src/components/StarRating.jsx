import React, { useState } from 'react';

const StarRating = ({ 
  rating = 0, 
  onRatingChange, 
  readonly = false, 
  size = 'md',
  showValue = false 
}) => {
  const [hoveredRating, setHoveredRating] = useState(0);

  const getSizeClasses = () => {
    const sizes = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-xl',
      xl: 'text-2xl'
    };
    return sizes[size] || sizes.md;
  };

  const handleStarClick = (starRating) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  const handleMouseEnter = (starRating) => {
    if (!readonly) {
      setHoveredRating(starRating);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoveredRating(0);
    }
  };

  const getStarColor = (starIndex) => {
    const currentRating = hoveredRating || rating;
    return starIndex <= currentRating ? 'text-yellow-400' : 'text-gray-300';
  };

  return (
    <div className="flex items-center space-x-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((starIndex) => (
          <button
            key={starIndex}
            type="button"
            className={`${getSizeClasses()} ${getStarColor(starIndex)} ${
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            } transition-all duration-150`}
            onClick={() => handleStarClick(starIndex)}
            onMouseEnter={() => handleMouseEnter(starIndex)}
            onMouseLeave={handleMouseLeave}
            disabled={readonly}
          >
            ★
          </button>
        ))}
      </div>
      {showValue && rating > 0 && (
        <span className="text-sm text-gray-600 ml-2">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;