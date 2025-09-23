import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';

const BookingPage = () => {
  const { businessId } = useParams();
  const navigate = useNavigate();
  
  const [business, setBusiness] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' or 'online'
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    holderName: ''
  });

  // Price calculation with online discount
  const basePrice = 50; // Base price in TND
  const onlineDiscount = paymentMethod === 'online' ? 0.02 : 0; // 2% discount
  const finalPrice = basePrice * (1 - onlineDiscount);

  useEffect(() => {
    fetchBusinessDetails();
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    fetchAvailability(today);
  }, [businessId]);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailability(selectedDate);
    }
  }, [selectedDate]);

  const fetchBusinessDetails = async () => {
    try {
      const response = await API.get(`/api/businesses/${businessId}`);
      setBusiness(response.data.business);
    } catch (err) {
      setError('Failed to load business details');
      console.error('Error fetching business:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async (date) => {
    try {
      const response = await API.get(`/api/businesses/${businessId}/availability?date=${date}`);
      setAvailability(response.data.slots || []);
    } catch (err) {
      console.error('Error fetching availability:', err);
      setAvailability([]);
    }
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    setSelectedTimeSlot(''); // Reset time slot when date changes
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    
    if (!selectedTimeSlot) {
      setError('Please select a time slot');
      return;
    }

    if (paymentMethod === 'online' && !showPaymentForm) {
      setShowPaymentForm(true);
      return;
    }

    setBookingLoading(true);
    setError(null);

    try {
      const bookingData = {
        businessId,
        date: selectedDate,
        time: selectedTimeSlot,
        customerInfo,
        paymentMethod,
        amount: finalPrice
      };

      if (paymentMethod === 'online') {
        bookingData.paymentDetails = paymentDetails;
      }

      const response = await API.post('/api/bookings', bookingData);
      
      // Show success message and redirect
      alert(`Booking confirmed! ${paymentMethod === 'online' ? 'Payment processed successfully.' : 'Please pay at the venue.'} Confirmation SMS sent to ${customerInfo.phone}`);
      navigate('/bookings'); // Redirect to user's bookings page
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create booking');
      console.error('Booking error:', err);
    } finally {
      setBookingLoading(false);
    }
  };

  const handlePaymentDetailsChange = (field, value) => {
    setPaymentDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatTimeSlot = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getNextSevenDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNumber = date.getDate();
      days.push({ dateString, dayName, dayNumber, isToday: i === 0 });
    }
    return days;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading business details...</div>
      </div>
    );
  }

  if (error && !business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
          >
            ← Back to search
          </button>
          
          {business && (
            <div className="flex items-start space-x-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">{business.name}</h1>
                <p className="text-gray-600 mt-1 flex items-center">
                  <span className="mr-2">📍</span>
                  {business.location}
                </p>
                <div className="flex items-center space-x-4 mt-3">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    {business.type?.replace('_', ' ')}
                  </span>
                  <div className="flex items-center">
                    <span className="text-yellow-400 mr-1">★</span>
                    <span className="text-sm text-gray-600">4.2 (23 reviews)</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  {finalPrice.toFixed(2)} TND
                </div>
                {paymentMethod === 'online' && (
                  <div className="text-sm text-green-500">
                    2% discount applied!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Booking Form */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Book Your Appointment</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleBooking} className="space-y-6">
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Date
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {getNextSevenDays().map((day) => (
                    <button
                      key={day.dateString}
                      type="button"
                      onClick={() => setSelectedDate(day.dateString)}
                      className={`p-3 text-center rounded-lg border ${
                        selectedDate === day.dateString
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                      } ${day.isToday ? 'ring-2 ring-blue-200' : ''}`}
                    >
                      <div className="text-xs font-medium">{day.dayName}</div>
                      <div className="text-lg font-bold">{day.dayNumber}</div>
                      {day.isToday && <div className="text-xs">Today</div>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Slot Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Available Time Slots
                </label>
                {availability.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No available slots for this date</p>
                    <p className="text-sm">Please select a different date</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {availability.map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => setSelectedTimeSlot(slot.time)}
                        className={`p-3 text-center rounded-lg border ${
                          selectedTimeSlot === slot.time
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                        }`}
                      >
                        {formatTimeSlot(slot.time)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Customer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Special Notes
                  </label>
                  <input
                    type="text"
                    value={customerInfo.notes}
                    onChange={(e) => setCustomerInfo({...customerInfo, notes: e.target.value})}
                    placeholder="Any special requests..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className={`cursor-pointer border-2 rounded-lg p-4 ${
                    paymentMethod === 'cash' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={paymentMethod === 'cash'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <div className="text-2xl mb-2">💰</div>
                      <div className="font-medium">Pay at Venue</div>
                      <div className="text-sm text-gray-600">{basePrice.toFixed(2)} TND</div>
                    </div>
                  </label>
                  
                  <label className={`cursor-pointer border-2 rounded-lg p-4 ${
                    paymentMethod === 'online' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="online"
                      checked={paymentMethod === 'online'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <div className="text-2xl mb-2">💳</div>
                      <div className="font-medium">Pay Online</div>
                      <div className="text-sm text-green-600">
                        {finalPrice.toFixed(2)} TND
                        <span className="block text-xs">2% discount!</span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Online Payment Form */}
              {showPaymentForm && paymentMethod === 'online' && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Card Holder Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={paymentDetails.holderName}
                        onChange={(e) => handlePaymentDetailsChange('holderName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Card Number *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="1234 5678 9012 3456"
                        value={paymentDetails.cardNumber}
                        onChange={(e) => handlePaymentDetailsChange('cardNumber', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expiry Date *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="MM/YY"
                        value={paymentDetails.expiryDate}
                        onChange={(e) => handlePaymentDetailsChange('expiryDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CVV *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="123"
                        value={paymentDetails.cvv}
                        onChange={(e) => handlePaymentDetailsChange('cvv', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-between items-center pt-6 border-t">
                <div className="text-lg font-semibold">
                  Total: <span className="text-2xl text-green-600">{finalPrice.toFixed(2)} TND</span>
                </div>
                <button
                  type="submit"
                  disabled={bookingLoading || !selectedTimeSlot}
                  className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bookingLoading ? 'Processing...' : 
                   paymentMethod === 'online' && !showPaymentForm ? 'Continue to Payment' : 
                   'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
      fetchAvailabilityForDate(selectedDate);
    }
  }, [selectedDate]);

  const fetchBusinessDetails = async () => {
    try {
      const response = await API.get(`/api/businesses/${businessId}`);
      setBusiness(response.data);
    } catch (err) {
      setError('Failed to load business details');
      console.error('Error fetching business:', err);
    }
  };

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/api/businesses/${businessId}/availability`);
      setAvailability(response.data);
    } catch (err) {
      setError('Failed to load availability');
      console.error('Error fetching availability:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailabilityForDate = async (date) => {
    try {
      const response = await API.get(`/api/businesses/${businessId}/availability/${date}`);
      setAvailability(response.data);
    } catch (err) {
      console.error('Error fetching availability for date:', err);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTimeSlot) {
      setError('Please select a date and time slot');
      return;
    }

    if (!customerInfo.name || !customerInfo.phone) {
      setError('Please fill in your name and phone number');
      return;
    }

    try {
      setBookingLoading(true);
      setError(null);

      const bookingData = {
        business_id: businessId,
        date: selectedDate,
        time_slot: selectedTimeSlot,
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        customer_email: customerInfo.email,
        notes: customerInfo.notes,
        payment_method: paymentMethod
      };

      const response = await API.post('/api/bookings', bookingData);
      
      if (paymentMethod === 'online') {
        // Redirect to payment gateway
        window.location.href = response.data.payment_url;
      } else {
        // Show success message and redirect
        alert('Booking confirmed! You will receive a confirmation SMS shortly.');
        navigate('/bookings');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create booking');
      console.error('Booking error:', err);
    } finally {
      setBookingLoading(false);
    }
  };

  const generateTimeSlots = () => {
    if (!business || !business.settings) return [];

    const slots = [];
    const slotDuration = business.settings.slot_duration_minutes || 30;
    
    // This is a simplified version - you'd want to get actual working hours
    const startHour = 9;
    const endHour = 17;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minutes = 0; minutes < 60; minutes += slotDuration) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    
    return slots;
  };

  const getNext7Days = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push({
        date: date.toISOString().split('T')[0],
        display: date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        })
      });
    }
    
    return days;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error && !business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  const timeSlots = generateTimeSlots();
  const availableDays = getNext7Days();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to search
          </button>
          
          {business && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{business.name}</h1>
              <p className="text-gray-600 mt-1">{business.location}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                {business.type?.replace('_', ' ')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Booking Form */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Book an Appointment</h2>
            
            {error && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                {error}
              </div>
            )}

            <form onSubmit={handleBooking} className="space-y-6">
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Date
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                  {availableDays.map(day => (
                    <button
                      key={day.date}
                      type="button"
                      onClick={() => setSelectedDate(day.date)}
                      className={`p-3 text-center rounded-md border transition-colors ${
                        selectedDate === day.date
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-sm font-medium">{day.display}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Slot Selection */}
              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Time
                  </label>
                  <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-2">
                    {timeSlots.map(time => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTimeSlot(time)}
                        className={`p-2 text-center rounded-md border transition-colors ${
                          selectedTimeSlot === time
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Customer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Special Notes
                  </label>
                  <textarea
                    value={customerInfo.notes}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="2"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Payment Method
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="cash"
                      checked={paymentMethod === 'cash'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-2"
                    />
                    Pay at the venue
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="online"
                      checked={paymentMethod === 'online'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-2"
                    />
                    Pay online (2% discount applied)
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                    bookingLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white`}
                >
                  {bookingLoading ? 'Processing...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
