# Quick Start Guide - Enhanced Registration

## What Changed?

The registration form now requires three additional fields:
- **Username**: Unique identifier (3-30 characters)
- **Phone Number**: Contact number (with format validation)
- **Birthday**: Date of birth (must be 13+ years old)

## To Apply These Changes:

### Step 1: Run the Database Migration

Option A - Using Supabase CLI (Recommended):
```bash
cd "c:\Users\ademm\OneDrive\Desktop\Personal Projects\rezervi"
supabase db push
```

Option B - Manual SQL execution:
1. Open your Supabase dashboard
2. Go to SQL Editor
3. Copy and paste the content from: `supabase/migrations/20251007_add_user_registration_fields.sql`
4. Execute the query

### Step 2: Restart Backend Server

```bash
cd "c:\Users\ademm\OneDrive\Desktop\Personal Projects\rezervi\server"
npm install  # Just to ensure all dependencies are current
node index.js
```

### Step 3: Restart Frontend Development Server

```bash
cd "c:\Users\ademm\OneDrive\Desktop\Personal Projects\rezervi\client"
npm install  # Just to ensure all dependencies are current
npm start
```

### Step 4: Test the Registration Flow

1. Navigate to http://localhost:3000/register
2. Fill in all fields:
   - Full Name: Your name
   - Username: testuser123 (3-30 chars, letters/numbers/_/-)
   - Phone Number: +1 234 567 8900
   - Birthday: Select a date (must be 13+ years ago)
   - Email: your@email.com
   - Password: (6+ characters)
   - Confirm Password: (match above)
3. Click "Create Account"
4. Verify you see success message
5. Login with the new credentials

## Validation Rules Quick Reference

### Username
- ✅ Valid: `john_doe`, `user123`, `test-user`
- ❌ Invalid: `ab` (too short), `user with spaces`, `user@123` (special chars)

### Phone Number
- ✅ Valid: `+1 234 567 8900`, `(555) 123-4567`, `1234567890`
- ❌ Invalid: `abc`, `12345` (too short), `123-ABC-4567`

### Birthday
- ✅ Valid: Any date between 1900-01-01 and 13 years ago
- ❌ Invalid: Future dates, less than 13 years ago, before 1900

## Troubleshooting

### Issue: "Username is already taken"
- Solution: Choose a different username

### Issue: "Please enter a valid phone number"
- Solution: Use format like +1 234 567 8900 or (555) 123-4567

### Issue: "You must be at least 13 years old"
- Solution: Select a birthday that makes you 13+ years old

### Issue: Migration fails
- Solution: Check if columns already exist
- Run: `SELECT column_name FROM information_schema.columns WHERE table_name = 'users';`
- If columns exist, skip migration

### Issue: Backend validation error
- Check server logs in the terminal
- Ensure all fields are being sent from frontend
- Verify field names match exactly

## New Field Details

| Field | Type | Required | Unique | Constraints |
|-------|------|----------|--------|-------------|
| username | text | Yes | Yes | 3-30 chars, alphanumeric + _ - |
| phone_number | text | Yes | No | 10-20 digits, validated format |
| birthday | date | Yes | No | Past date, 13+ years old |

## API Request Example

```javascript
// New registration request format
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "full_name": "John Doe",
  "username": "johndoe123",
  "phone_number": "+1 234 567 8900",
  "birthday": "1995-06-15"
}
```

## Response Examples

### Success Response
```json
{
  "message": "Registration successful! You can now log in.",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com"
  }
}
```

### Error Responses
```json
// Missing field
{
  "error": "All fields are required: email, password, full_name, username, phone_number, and birthday"
}

// Invalid username
{
  "error": "Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens"
}

// Username taken
{
  "error": "Username is already taken. Please choose another one."
}

// Invalid phone
{
  "error": "Please enter a valid phone number (10-20 digits)"
}

// Under age
{
  "error": "You must be at least 13 years old to register"
}
```

## Files Changed

✅ Backend:
- `server/controller/authController.js` - Added validation and new fields

✅ Frontend:
- `client/src/pages/Register.jsx` - Added form fields and validation
- `client/src/api/auth.js` - Updated API call
- `client/src/components/AuthForm.js` - Added test form fields

✅ Database:
- `supabase/enhanced_schema.sql` - Updated schema
- `supabase/migrations/20251007_add_user_registration_fields.sql` - New migration

## Next Steps

1. ✅ Run database migration
2. ✅ Test registration with valid data
3. ✅ Test validation errors
4. ⬜ Update any existing users to fill in new fields
5. ⬜ Consider adding username availability checker
6. ⬜ Consider adding phone number verification
7. ⬜ Update user profile page to show new fields

## Need Help?

Check the full documentation: `REGISTRATION_ENHANCEMENT_SUMMARY.md`
