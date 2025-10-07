const supabase = require('../supabaseClient');
const { createClient } = require('@supabase/supabase-js');

// Create a separate admin client that always uses service role
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const register = async (req, res) => {
  const { email, password, username, phone_number, birthday } = req.body;

  try {
    // Validate required fields
    if (!email || !password || !username || !phone_number || !birthday) {
      return res.status(400).json({ 
        error: 'All fields are required: email, password, username, phone_number, and birthday' 
      });
    }

    // Validate username format (alphanumeric, underscore, hyphen, 3-30 characters)
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ 
        error: 'Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens' 
      });
    }

    // Validate phone number format
    const phoneRegex = /^\+?[0-9\s\-\(\)]{8,15}$/;
    if (!phoneRegex.test(phone_number)) {
      return res.status(400).json({ 
        error: 'Please enter a valid phone number (8-15 digits)' 
      });
    }

    // Validate birthday
    const birthdayDate = new Date(birthday);
    const today = new Date();
    const minDate = new Date('1900-01-01');
    
    if (isNaN(birthdayDate.getTime()) || birthdayDate > today || birthdayDate < minDate) {
      return res.status(400).json({ 
        error: 'Please enter a valid birthday (must be in the past)' 
      });
    }

    // Calculate age (must be at least 13 years old)
    const age = Math.floor((today - birthdayDate) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 13) {
      return res.status(400).json({ 
        error: 'You must be at least 13 years old to register' 
      });
    }

    // Check if username already exists
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('username')
      .eq('username', username)
      .single();

    if (existingUser) {
      return res.status(400).json({ 
        error: 'Username is already taken. Please choose another one.' 
      });
    }

    // Use admin client to create user without email confirmation
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email confirmation - user is auto-confirmed
      user_metadata: {
        username: username,
        phone_number: phone_number,
        birthday: birthday
      }
    });

    if (authError) return res.status(400).json({ error: authError.message });

    const user_id = authData.user.id;

    // Insert user into public.users table using admin client to bypass RLS
    const { data: publicUserData, error: publicUserError } = await supabaseAdmin
      .from('users')
      .insert([{ 
        id: user_id, 
        role: 'client',
        email: email,
        username: username,
        phone_number: phone_number,
        birthday: birthday
      }])
      .select();

    if (publicUserError) {
      console.error('Error inserting into public.users:', publicUserError);
      // Try to clean up the auth user if profile creation failed
      await supabaseAdmin.auth.admin.deleteUser(user_id);
      return res.status(500).json({ error: 'User registration failed: could not create user profile.' });
    }

    res.status(200).json({ 
      message: 'Registration successful! You can now log in.', 
      user: authData.user
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return res.status(400).json({ error: error.message });

    const user_id = data.user.id;

    // Check if user exists in public.users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role, email, username')
      .eq('id', user_id)
      .single();

    if (userError || !userData) {
      console.error('Error fetching user from public.users on login:', userError);
      return res.status(500).json({ error: 'Login failed: user profile not found. Please register first.' });
    }

    // Set HttpOnly cookie with the access token
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('sb-access-token', data.session.access_token, {
      httpOnly: true,
      secure: isProduction,
      maxAge: data.session.expires_in * 1000,
      sameSite: isProduction ? 'None' : 'Lax',
      path: '/'
    });
    res.cookie('sb-refresh-token', data.session.refresh_token, {
      httpOnly: true,
      secure: isProduction,
      maxAge: data.session.expires_in * 1000,
      sameSite: isProduction ? 'None' : 'Lax',
      path: '/'
    });

    res.status(200).json({ message: 'Login successful', user: data.user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const logout = (req, res) => {
  res.clearCookie('sb-access-token', { path: '/' });
  res.clearCookie('sb-refresh-token', { path: '/' });
  res.status(200).json({ message: 'Logged out successfully' });
};

const getMe = async (req, res) => {
  console.log('Controller: getMe called.');
  if (!req.user || !req.user.id) {
    console.log('Controller: getMe - req.user is missing or id is undefined.');
    return res.status(400).json({ message: 'User information not available.' });
  }

  const userId = req.user.id;
  console.log('Controller: Authenticated user ID from token:', userId);

  try {
    // Use req.supabase for RLS-aware query
    console.log('Controller: Attempting to fetch user from public.users for ID:', userId);
    const { data: userData, error } = await req.supabase // Use req.supabase
      .from('users')
      .select('id, email, username, phone_number, birthday, role, profile_picture_url, created_at')
      .eq('id', userId)
      .single();

    if (error || !userData) {
      console.log('Controller: Error fetching user from public.users:', error?.message || 'No user data.');
      return res.status(404).json({ message: 'User profile not found.' });
    }

    console.log('Controller: Successfully fetched user profile:', userData.username);
    res.status(200).json({
      id: userData.id,
      email: userData.email,
      username: userData.username,
      phone_number: userData.phone_number,
      birthday: userData.birthday,
      role: userData.role,
      profile_picture_url: userData.profile_picture_url,
      created_at: userData.created_at,
    });
  } catch (error) {
    console.error('Controller: Unexpected error in getMe:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  console.log('updateProfile called with body:', req.body);
  
  if (!req.user || !req.user.id) {
    console.error('User not authenticated:', req.user);
    return res.status(400).json({ message: 'User information not available.' });
  }

  const userId = req.user.id;
  const { username, phone_number, birthday } = req.body;
  
  console.log(`Attempting to update user ${userId}`);
  
  // Build update object with only provided fields
  const updateData = {};
  if (username) updateData.username = username;
  if (phone_number) updateData.phone_number = phone_number;
  if (birthday) updateData.birthday = birthday;
  
  if (Object.keys(updateData).length === 0) {
    console.error('No fields to update');
    return res.status(400).json({ error: 'At least one field is required to update' });
  }
  
  // Validate username format if provided
  if (username) {
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ 
        error: 'Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens' 
      });
    }
  }
  
  // Validate phone number format if provided
  if (phone_number) {
    const phoneRegex = /^\+?[0-9\s\-\(\)]{8,15}$/;
    if (!phoneRegex.test(phone_number)) {
      return res.status(400).json({ 
        error: 'Please enter a valid phone number (8-15 digits)' 
      });
    }
  }
  
  // Validate birthday if provided
  if (birthday) {
    const birthdayDate = new Date(birthday);
    const today = new Date();
    const minDate = new Date('1900-01-01');
    
    if (isNaN(birthdayDate.getTime()) || birthdayDate > today || birthdayDate < minDate) {
      return res.status(400).json({ 
        error: 'Please enter a valid birthday (must be in the past)' 
      });
    }
    
    const age = Math.floor((today - birthdayDate) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 13) {
      return res.status(400).json({ 
        error: 'You must be at least 13 years old' 
      });
    }
  }
  
  try {
    console.log('Updating user in Supabase using admin rights (bypassing RLS)...');
    // Use the admin client (supabaseAdmin) to bypass RLS
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select();

    if (error) {
      console.error('Supabase error when updating profile:', error);
      return res.status(400).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      console.error('No data returned from update operation');
      return res.status(404).json({ error: 'User not found or update failed' });
    }

    console.log('Profile updated successfully:', data[0]);
    res.status(200).json({
      message: 'Profile updated successfully',
      user: data[0]
    });
  } catch (error) {
    console.error('Exception in updateProfile:', error);
    res.status(500).json({ error: error.message });
  }
};

// Upload profile picture
const uploadProfilePicture = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(400).json({ message: 'User information not available.' });
  }

  const userId = req.user.id;
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`; // No subfolder needed

    // Upload to Supabase Storage using the 'profile images' bucket with admin client
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('profile images')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600'
      });

    if (uploadError) {
      return res.status(400).json({ error: uploadError.message });
    }

    // Get the public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('profile images')
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    // Update user profile with the new picture URL using admin rights (bypassing RLS)
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ 
        profile_picture_url: publicUrl
      })
      .eq('id', userId)
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({
      message: 'Profile picture updated successfully',
      profile_picture_url: publicUrl
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { 
  register,
  login,
  logout,
  getMe,
  updateProfile,
  uploadProfilePicture
}; 