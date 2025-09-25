# Rezervi - Deployment Guide

## Vercel Deployment Instructions

### Prerequisites
1. Your code should be pushed to GitHub
2. You need to deploy your backend server separately (Render, Railway, Fly.io, etc.)

### Steps to Deploy on Vercel

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com) and sign in with GitHub
   - Click "New Project"
   - Import your `rezervi` repository
   - Vercel will automatically detect the configuration from `vercel.json`

3. **Set Environment Variables in Vercel**:
   - In your Vercel project dashboard, go to "Settings" > "Environment Variables"
   - Add these variables:
     ```
     REACT_APP_API_BASE_URL=https://your-backend-url.com
     REACT_APP_SUPABASE_URL=https://dngapqoyfcgehyltxugo.supabase.co
     REACT_APP_SUPABASE_ANON_KEY=your_supabase_key
     ```
   - Replace `https://your-backend-url.com` with your actual backend deployment URL

4. **Deploy Your Backend First**:
   - Deploy the `server` folder to Render, Railway, or another platform
   - Update the `REACT_APP_API_BASE_URL` in Vercel with your backend URL
   - Make sure your backend allows CORS from your Vercel domain

5. **Redeploy**:
   - After setting environment variables, trigger a new deployment in Vercel

### Backend CORS Configuration
Make sure your backend (server/index.js) has proper CORS settings:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000', // For development
    'https://your-vercel-app.vercel.app' // Your Vercel domain
  ],
  credentials: true
}));
```

### Important Notes
- The client will be deployed at `https://your-project-name.vercel.app`
- Environment variables starting with `REACT_APP_` are exposed to the client
- Never put sensitive keys in client environment variables
- The backend server needs to be deployed separately as Vercel's serverless functions have different requirements

### Troubleshooting
- If you get API errors, check that `REACT_APP_API_BASE_URL` is set correctly
- If authentication doesn't work, verify CORS settings on your backend
- Check Vercel's deployment logs for build errors