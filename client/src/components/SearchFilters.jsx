import React from 'react';

const SearchFilters = ({ filters, setFilters }) => {
  const businessTypes = [
    { value: '', label: 'All Types' },
    { value: 'barbershop', label: 'Barbershop' },
    { value: 'beauty_salon', label: 'Beauty Salon' },
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'cafe', label: 'Café' },
    { value: 'football_field', label: 'Football Field' },
    { value: 'tennis_court', label: 'Tennis Court' },
    { value: 'gym', label: 'Gym' },
    { value: 'car_wash', label: 'Car Wash' },
    { value: 'spa', label: 'Spa & Wellness' },
    { value: 'dentist', label: 'Dentist' },
    { value: 'doctor', label: 'Doctor' },
    { value: 'other', label: 'Other' }
  ];

  const ratingOptions = [
    { value: '', label: 'Any Rating' },
    { value: '4.5', label: '4.5+ Stars' },
    { value: '4.0', label: '4.0+ Stars' },
    { value: '3.5', label: '3.5+ Stars' },
    { value: '3.0', label: '3.0+ Stars' }
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {/* Business Type Filter */}
      <select
        value={filters.type}
        onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
        className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
      >
        {businessTypes.map(type => (
          <option key={type.value} value={type.value}>{type.label}</option>
        ))}
      </select>

      {/* Location Filter */}
      <input
        type="text"
        placeholder="Location..."
        value={filters.location}
        onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
        className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />

      {/* Rating Filter */}
      <select
        value={filters.rating}
        onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value }))}
        className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
      >
        {ratingOptions.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>

      {/* Clear Filters Button */}
      <button
        onClick={() => setFilters({ type: '', location: '', rating: '', priceRange: '' })}
        className="px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
      >
        Clear All
      </button>
    </div>
  );
};

export default SearchFilters;
