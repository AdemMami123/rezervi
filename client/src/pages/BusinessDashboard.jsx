import React, { useEffect, useState } from 'react';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';
import UsageTracker from '../components/UsageTracker';

const daysOfWeek = [
  { name: 'Monday', value: 'monday' },
  { name: 'Tuesday', value: 'tuesday' },
  { name: 'Wednesday', value: 'wednesday' },
  { name: 'Thursday', value: 'thursday' },
  { name: 'Friday', value: 'friday' },
  { name: 'Saturday', value: 'saturday' },
  { name: 'Sunday', value: 'sunday' },
];

function BusinessDashboard() {
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [settings, setSettings] = useState({
    slot_duration_minutes: 30,
    working_hours_json: daysOfWeek.map(day => ({ day: day.value, enabled: false, open: '09:00', close: '17:00' })),
    online_payment_enabled: false,
    accept_walkins: false,
    max_simultaneous_bookings: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [settingsMessage, setSettingsMessage] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');

  const fetchBusinessData = async () => {
    console.log('BusinessDashboard: Starting data fetch...');
    setLoading(true);
    setError(null);
    try {
      console.log('BusinessDashboard: Fetching user business...');
      const businessRes = await API.get('/api/business/user-business');
      console.log('BusinessDashboard: user-business response:', businessRes.data);

      if (!businessRes.data.business) {
        console.log('BusinessDashboard: No business found for user. Redirecting to /register-business.');
        setBusiness(null);
        navigate('/register-business');
        return;
      }
      setBusiness(businessRes.data.business);

      const settingsRes = await API.get('/api/business/settings');
      if (settingsRes.data.settings) {
        setSettings(prevSettings => ({
          ...prevSettings,
          ...settingsRes.data.settings,
          working_hours_json: settingsRes.data.settings.working_hours_json || prevSettings.working_hours_json,
        }));
      }

      console.log('BusinessDashboard: Fetching business reservations...');
      const reservationsRes = await API.get('/api/business/reservations');
      console.log('BusinessDashboard: reservations response:', reservationsRes.data);
      setReservations(reservationsRes.data.reservations);
      console.log('BusinessDashboard: Reservations loaded.');

    } catch (err) {
      console.error('BusinessDashboard: Error during data fetch:', err.response?.data || err);
      setError(err.response?.data?.error || 'Failed to fetch dashboard data.');
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.log('BusinessDashboard: Unauthorized. Redirecting to /login.');
        navigate('/login'); // Redirect to login if unauthorized
      }
    } finally {
      console.log('BusinessDashboard: Data fetch finished. Loading:', false);
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('BusinessDashboard: Component mounted, triggering data fetch.');
    fetchBusinessData();
  }, [navigate]);

  const handleSettingChange = (e) => {
    const { name, type, checked, value } = e.target;
    setSettings(prevSettings => ({
      ...prevSettings,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleWorkingHoursChange = (dayIndex, field, value) => {
    setSettings(prevSettings => {
      const newWorkingHours = [...prevSettings.working_hours_json];
      newWorkingHours[dayIndex] = { ...newWorkingHours[dayIndex], [field]: value };
      return { ...prevSettings, working_hours_json: newWorkingHours };
    });
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setSettingsMessage(null);
    setError(null);
    try {
      console.log('BusinessDashboard: Updating settings...', settings);
      const response = await API.put('/api/business/settings', settings);
      console.log('BusinessDashboard: Settings update response:', response.data);
      setSettingsMessage(response.data.message);
    } catch (err) {
      console.error('BusinessDashboard: Error updating settings:', err.response?.data || err);
      setError(err.response?.data?.error || 'Failed to update settings.');
    }
  };

  const handleStatusChange = async (reservationId, newStatus) => {
    try {
      console.log(`BusinessDashboard: Updating reservation ${reservationId} to status ${newStatus}`);
      await API.put(`/api/business/reservations/${reservationId}`, { payment_status: newStatus }); // Changed to payment_status
      setReservations(prevReservations =>
        prevReservations.map(res =>
          res.id === reservationId ? { ...res, payment_status: newStatus } : res // Changed to payment_status
        )
      );
      alert('Reservation status updated!'); 
    } catch (err) {
      console.error('BusinessDashboard: Error updating reservation status:', err.response?.data || err);
      setError(err.response?.data?.error || 'Failed to update reservation status.');
    }
  };

  if (loading) {
    console.log('BusinessDashboard: Rendering loading state.');
    return <div className="min-h-screen flex items-center justify-center bg-gray-100"><p className="text-gray-700 text-xl">Loading dashboard...</p></div>;
  }

  if (error) {
    console.log('BusinessDashboard: Rendering error state.', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-100 text-red-700 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <p className="text-red-600 text-center mb-4">Error: {error}</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  console.log('BusinessDashboard: Rendering main content. Business:', business, 'Reservations:', reservations, 'Settings:', settings);
  
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6 sm:mb-8 text-center">Business Dashboard</h1>

        {/* Business Info Section */}
        <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">{business?.name || 'Your Business'}</h2>
          <p className="text-gray-600 text-sm sm:text-base">Type: {business?.type}</p>
          <p className="text-gray-600 text-sm sm:text-base">Location: {business?.location}</p>
          {/* Add more business details here if needed */}
        </div>

        {/* Usage Tracking Section */}
        <div className="mb-6 sm:mb-8">
          <UsageTracker compact={true} />
        </div>

        {/* Quick Actions Section */}
        <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <button
              onClick={() => navigate('/commission-analytics')}
              className="flex items-center justify-center p-3 sm:p-4 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors"
            >
              <div className="text-center">
                <div className="text-xl sm:text-2xl mb-1 sm:mb-2">📊</div>
                <div className="text-xs sm:text-sm font-semibold text-purple-700">Commission Analytics</div>
              </div>
            </button>
            <button
              onClick={() => navigate('/subscription')}
              className="flex items-center justify-center p-3 sm:p-4 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
            >
              <div className="text-center">
                <div className="text-xl sm:text-2xl mb-1 sm:mb-2">💎</div>
                <div className="text-xs sm:text-sm font-semibold text-blue-700">Subscription Plans</div>
              </div>
            </button>
            <button
              onClick={() => setActiveSection('reservations')}
              className="flex items-center justify-center p-3 sm:p-4 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
            >
              <div className="text-center">
                <div className="text-xl sm:text-2xl mb-1 sm:mb-2">📅</div>
                <div className="text-xs sm:text-sm font-semibold text-green-700">View Reservations</div>
              </div>
            </button>
            <button
              onClick={() => setActiveSection('settings')}
              className="flex items-center justify-center p-3 sm:p-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <div className="text-center">
                <div className="text-xl sm:text-2xl mb-1 sm:mb-2">⚙️</div>
                <div className="text-xs sm:text-sm font-semibold text-gray-700">Business Settings</div>
              </div>
            </button>
          </div>
        </div>

        {/* Business Settings Section */}
        <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Business Settings</h2>
          {settingsMessage && <p className="text-green-600 text-center mb-4 bg-green-100 p-3 rounded-md text-sm sm:text-base">{settingsMessage}</p>}
          <form onSubmit={handleUpdateSettings}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
              <div>
                <label htmlFor="slot_duration_minutes" className="block text-gray-700 text-sm font-semibold mb-2">Slot Duration (minutes):</label>
                <input
                  type="number"
                  id="slot_duration_minutes"
                  name="slot_duration_minutes"
                  className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out"
                  value={settings.slot_duration_minutes}
                  onChange={handleSettingChange}
                  min="10"
                  required
                />
              </div>
              <div>
                <label htmlFor="max_simultaneous_bookings" className="block text-gray-700 text-sm font-semibold mb-2">Max Simultaneous Bookings:</label>
                <input
                  type="number"
                  id="max_simultaneous_bookings"
                  name="max_simultaneous_bookings"
                  className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out"
                  value={settings.max_simultaneous_bookings}
                  onChange={handleSettingChange}
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-semibold mb-2">Working Hours:</label>
              {settings.working_hours_json.map((day, index) => (
                <div key={day.day} className="flex items-center space-x-4 mb-2">
                  <input
                    type="checkbox"
                    id={`day-${day.day}`}
                    checked={day.enabled}
                    onChange={(e) => handleWorkingHoursChange(index, 'enabled', e.target.checked)}
                    className="form-checkbox h-5 w-5 text-blue-600 rounded"
                  />
                  <label htmlFor={`day-${day.day}`} className="text-gray-700 w-24">{daysOfWeek[index].name}:</label>
                  <input
                    type="time"
                    value={day.open}
                    onChange={(e) => handleWorkingHoursChange(index, 'open', e.target.value)}
                    disabled={!day.enabled}
                    className="shadow-sm border border-gray-300 rounded-lg py-1 px-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out"
                  />
                  <span>-</span>
                  <input
                    type="time"
                    value={day.close}
                    onChange={(e) => handleWorkingHoursChange(index, 'close', e.target.value)}
                    disabled={!day.enabled}
                    className="shadow-sm border border-gray-300 rounded-lg py-1 px-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out"
                  />
                </div>
              ))}
            </div>

            <div className="mb-6 flex items-center space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="online_payment_enabled"
                  checked={settings.online_payment_enabled}
                  onChange={handleSettingChange}
                  className="form-checkbox h-5 w-5 text-blue-600 rounded"
                />
                <span className="ml-2 text-gray-700">Enable Online Payment</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="accept_walkins"
                  checked={settings.accept_walkins}
                  onChange={handleSettingChange}
                  className="form-checkbox h-5 w-5 text-blue-600 rounded"
                />
                <span className="ml-2 text-gray-700">Accept Walk-ins</span>
              </label>
            </div>

            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline w-full transform transition duration-200 ease-in-out hover:scale-105"
            >
              Update Settings
            </button>
          </form>
        </div>

        {/* Recent Reservations Section */}
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Recent Reservations</h2>
        {reservations.length === 0 ? (
          <p className="text-gray-600">No reservations found.</p>
        ) : (
          <div className="overflow-x-auto bg-white shadow-md rounded-lg">
            <table className="min-w-full leading-normal">
              <thead>
                <tr>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reservation ID</th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer Name</th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Time</th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Payment Status</th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((reservation) => (
                  <tr key={reservation.id}>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{reservation.id.substring(0, 8)}...</td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{reservation.users?.full_name || 'N/A'}</td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{new Date(reservation.date).toLocaleDateString()}</td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{reservation.time}</td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      <span className={`relative inline-block px-3 py-1 font-semibold leading-tight ${reservation.payment_status === 'paid' ? 'text-green-900' : 'text-yellow-900'}`}>
                        <span aria-hidden="true" className={`absolute inset-0 opacity-50 rounded-full ${reservation.payment_status === 'paid' ? 'bg-green-200' : 'bg-yellow-200'}`}></span>
                        <span className="relative">{reservation.payment_status}</span>
                      </span>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      <select
                        value={reservation.payment_status}
                        onChange={(e) => handleStatusChange(reservation.id, e.target.value)}
                        className="block w-full text-gray-700 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="unpaid">Unpaid</option>
                        <option value="paid">Paid</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default BusinessDashboard; 