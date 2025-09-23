const supabase = require('../supabaseClient');
// const { createClient } = require('@supabase/supabase-js'); // Removing temporary debug import

// Removed supabaseAdmin initialization and helper function as they are not needed outside of debug

const register = async (req, res) => {
  const { email, password, full_name } = req.body;

  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) return res.status(400).json({ error: authError.message });

    const user_id = authData.user.id;

    // Insert user into public.users table with a default role of 'client'
    const { data: publicUserData, error: publicUserError } = await supabase
      .from('users')
      .insert([{ id: user_id, role: 'client', full_name: full_name || email }])
      .select();

    if (publicUserError) {
      console.error('Error inserting into public.users:', publicUserError);
      return res.status(500).json({ error: 'User registration failed: could not create user profile.' });
    }

    res.status(200).json({ message: 'Registration successful, please check your email for verification.', user: authData.user });

  } catch (error) {
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

    // Upsert user into public.users table
    const { error: upsertError } = await supabase
      .from('users')
      .upsert(
        { id: user_id, role: 'client', full_name: data.user.email },
        { onConflict: 'id' }
      );

    if (upsertError) {
      console.error('Error upserting into public.users on login:', upsertError);
      return res.status(500).json({ error: 'Login failed: could not sync user profile.' });
    }

    // Set HttpOnly cookie with the access token
    res.cookie('sb-access-token', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: data.session.expires_in * 1000,
      sameSite: 'Lax',
      path: '/'
    });
    res.cookie('sb-refresh-token', data.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: data.session.expires_in * 1000,
      sameSite: 'Lax',
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
      .select('id, full_name, role')
      .eq('id', userId)
      .single();

    if (error || !userData) {
      console.log('Controller: Error fetching user from public.users:', error?.message || 'No user data.');
      return res.status(404).json({ message: 'User profile not found.' });
    }

    console.log('Controller: Successfully fetched user profile:', userData.full_name);
    res.status(200).json({
      id: userData.id,
      email: req.user.email,
      full_name: userData.full_name,
      role: userData.role,
    });
  } catch (error) {
    console.error('Controller: Unexpected error in getMe:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { 
  register,
  login,
  logout,
  getMe
}; 