import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

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
      alert(`Booking confirmed! ${paymentMethod === 'online' ? 'Payment processed successfully.' : 'Please pay at the venue.'} Confirmation: ${response.data.confirmationCode}`);
      navigate('/?tab=bookings'); // Redirect to dashboard bookings tab
      
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 text-sm sm:text-base"
          >
            ← Back to search
          </Button>
          
          {business && (
            <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{business.name}</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1 flex items-center text-sm sm:text-base">
                  <span className="mr-2">📍</span>
                  {business.location}
                </p>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3">
                  <Badge variant="secondary" className="text-xs sm:text-sm">
                    {business.type?.replace('_', ' ')}
                  </Badge>
                  <div className="flex items-center">
                    <span className="text-yellow-400 mr-1">★</span>
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">4.2 (23 reviews)</span>
                  </div>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                  {finalPrice.toFixed(2)} TND
                </div>
                {paymentMethod === 'online' && (
                  <Badge variant="secondary" className="text-sm text-green-600 dark:text-green-400 mt-1">
                    2% discount applied!
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Booking Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Card className="shadow-lg border-2">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Book Your Appointment</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Badge variant="destructive" className="mb-4 w-full py-2">
                {error}
              </Badge>
            )}

            <form onSubmit={handleBooking} className="space-y-6">
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Date
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1 sm:gap-2">
                  {getNextSevenDays().map((day) => (
                    <button
                      key={day.dateString}
                      type="button"
                      onClick={() => setSelectedDate(day.dateString)}
                      className={`p-2 sm:p-3 text-center rounded-lg border text-xs sm:text-sm ${
                        selectedDate === day.dateString
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                      } ${day.isToday ? 'ring-2 ring-blue-200' : ''}`}
                    >
                      <div className="font-medium">{day.dayName}</div>
                      <div className="text-sm sm:text-lg font-bold">{day.dayNumber}</div>
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                    {availability.map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => setSelectedTimeSlot(slot.time)}
                        className={`p-2 sm:p-3 text-center rounded-lg border text-xs sm:text-sm ${
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
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    type="text"
                    required
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Special Notes</Label>
                  <Input
                    id="notes"
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
              <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t gap-4">
                <div className="text-lg font-semibold">
                  Total: <span className="text-2xl text-green-600 dark:text-green-400">{finalPrice.toFixed(2)} TND</span>
                </div>
                <Button
                  type="submit"
                  disabled={bookingLoading || !selectedTimeSlot}
                  className="px-8 py-3"
                  size="lg"
                >
                  {bookingLoading ? 'Processing...' : 
                   paymentMethod === 'online' && !showPaymentForm ? 'Continue to Payment' : 
                   'Confirm Booking'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BookingPage;
