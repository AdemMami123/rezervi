const { createClient } = require('@supabase/supabase-js');
const supabase = require('../supabaseClient'); // Keep for initial client creation if needed elsewhere
require('dotenv').config();
const protect = async (req, res, next) => {
  let token;

  console.log('Middleware: Checking cookies...', req.cookies);

  if (req.cookies && req.cookies['sb-access-token']) {
    token = req.cookies['sb-access-token'];
    console.log('Middleware: Token found in cookie.', token ? 'exists' : 'empty');
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    console.log('Middleware: Token found in Authorization header.', token ? 'exists' : 'empty');
  }

  if (!token) {
    console.log('Middleware: No token found. Returning 401.');
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    console.log('Middleware: Validating token with Supabase...');
    const { data: authData, error: authError } = await supabase.auth.getUser(token);

    if (authError) {
      console.log('Middleware: Supabase getUser failed.', authError.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }

    if (!authData.user) {
      console.log('Middleware: Supabase getUser returned no user.');
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    const user_id = authData.user.id;

    // Check if user exists in public.users table (don't create, just verify)
    console.log('Middleware: Checking user exists in public.users with ID:', user_id);
    const { data: publicUser, error: publicUserError } = await supabase
      .from('users')
      .select('id, role, email, username')
      .eq('id', user_id)
      .single();

    if (publicUserError || !publicUser) {
      console.error('Middleware: User not found in public.users:', publicUserError);
      return res.status(401).json({ message: 'User profile not found. Please complete registration.' });
    }
    console.log('Middleware: Public user profile verified.', publicUser);

    req.user = authData.user; // User data from Supabase Auth
    // Create and attach a session-aware Supabase client to the request
    req.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY, // Use ANON key for the session client
      {
        global: {
          headers: { Authorization: `Bearer ${token}` }
        }
      }
    );

    console.log('Middleware: User authenticated. req.user populated with ID:', req.user.id);
    next();
  } catch (error) {
    console.error('Middleware: Unexpected error during token validation:', error);
    res.status(401).json({ message: 'Not authorized, token validation error' });
  }
};

const optionalAuth = async (req, res, next) => {
  let token;

  console.log('Optional Auth Middleware: Checking for authentication...');

  if (req.cookies && req.cookies['sb-access-token']) {
    token = req.cookies['sb-access-token'];
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    console.log('Optional Auth Middleware: No token found, proceeding without auth.');
    // Set up default supabase client without auth
    req.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    return next();
  }

  try {
    console.log('Optional Auth Middleware: Token found, attempting validation...');
    const { data: authData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      console.log('Optional Auth Middleware: Token invalid, proceeding without auth.');
      req.supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
      return next();
    }

    // Valid authentication found
    const user_id = authData.user.id;

    // Check if user exists in public.users table
    const { data: publicUser, error: publicUserError } = await supabase
      .from('users')
      .select('id, role, email, username')
      .eq('id', user_id)
      .single();

    if (publicUserError || !publicUser) {
      console.error('Optional Auth Middleware: User not found in public.users:', publicUserError);
      req.supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
      return next();
    }

    req.user = authData.user;
    req.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` }
        }
      }
    );

    console.log('Optional Auth Middleware: User authenticated. ID:', req.user.id);
    next();
  } catch (error) {
    console.error('Optional Auth Middleware: Error during validation:', error);
    req.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    next();
  }
};

module.exports = { protect, optionalAuth }; 