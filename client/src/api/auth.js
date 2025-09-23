const API_BASE_URL = 'http://localhost:5000';

export const authAPI = {
  // Register new user
  register: async (email, password, full_name) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important: include cookies
      body: JSON.stringify({ email, password, full_name }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    
    return data;
  },

  // Login user
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important: include cookies
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }
    
    return data;
  },

  // Logout user
  logout: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include', // Important: include cookies
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Logout failed');
    }
    
    return data;
  },

  // Get current user profile
  getMe: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      credentials: 'include', // Important: include cookies
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get user profile');
    }
    
    return data;
  },

  // Update user profile
  updateProfile: async (userData) => {
    console.log('Updating profile with data:', userData);
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      console.log('Update profile response status:', response.status);
      const data = await response.json();
      console.log('Update profile response data:', data);
      
      if (!response.ok) {
        console.error('Error updating profile:', data.error || 'Failed to update profile');
        throw new Error(data.error || 'Failed to update profile');
      }
      
      return data;
    } catch (error) {
      console.error('Exception in updateProfile API call:', error);
      throw error;
    }
  },

  // Upload profile picture
  uploadProfilePicture: async (imageFile) => {
    const formData = new FormData();
    formData.append('profile_picture', imageFile);

    const response = await fetch(`${API_BASE_URL}/auth/profile-picture`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to upload profile picture');
    }
    
    return data;
  }
};