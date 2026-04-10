# Deployment Guide (Demo/Interview)

## Quick Deploy to Render (Free Tier)

### Prerequisites
- GitHub account (already have repos ✓)
- Render account (sign up at render.com)

### Step 1: Deploy Backend (5 minutes)

1. Go to https://render.com and sign up with GitHub
2. Click **New +** → **Web Service**
3. Connect your GitHub account and select `task-management-backend` repository
4. Configure:
   - **Name**: `task-management-backend` (or any name)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. Add Environment Variables:
   - `JWT_SECRET` = `demo-secret-key-change-in-production-12345`
   - `FRONTEND_URL` = (leave empty for now, will update after frontend deploy)
6. Click **Create Web Service**
7. Wait for deployment (~2-3 minutes)
8. Copy the URL (e.g., `https://task-management-backend-xyz.onrender.com`)

### Step 2: Deploy Frontend (5 minutes)

1. In Render dashboard, click **New +** → **Static Site**
2. Select `task-management-frontend` repository
3. Configure:
   - **Name**: `task-management-frontend` (or any name)
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add Environment Variable:
   - `VITE_API_URL` = `https://task-management-backend-xyz.onrender.com` (use URL from Step 1)
5. Click **Create Static Site**
6. Wait for deployment (~2-3 minutes)
7. Copy the URL (e.g., `https://task-management-frontend-xyz.onrender.com`)

### Step 3: Update Backend CORS (2 minutes)

1. Go back to backend service in Render
2. Click **Environment** tab
3. Add/Update environment variable:
   - `FRONTEND_URL` = `https://task-management-frontend-xyz.onrender.com` (use URL from Step 2)
4. Save changes (will auto-redeploy)

### Step 4: Test

1. Open frontend URL in browser
2. Register a new organization (demo data won't be there)
3. Login and test features
4. Share the frontend URL with interviewer

## Important Notes

### Free Tier Limitations
- Backend spins down after 15 minutes of inactivity
- First request after inactivity takes ~30 seconds to wake up
- Warn interviewer: "First load might take 30 seconds"

### Database
- SQLite database is ephemeral on Render free tier
- Data will be lost on each redeploy
- For persistent demo, create fresh demo data after each deploy

### Demo Credentials
After deployment, register a new organization with:
- Organization: "Demo Corp"
- Email: "admin@demo.com"
- Name: "Demo Admin"
- Password: "Welcome@123"

Then create demo users and teams through the admin panel.

## Alternative: Local Demo

If deployment issues occur, run locally and use ngrok:

```bash
# Terminal 1 - Backend
cd ~/Documents/task-management-design/implementation/backend
npm start

# Terminal 2 - Frontend  
cd ~/Documents/task-management-design/implementation/frontend
npm run dev

# Terminal 3 - Expose backend
ngrok http 3000

# Terminal 4 - Expose frontend
ngrok http 5173
```

Update frontend .env with ngrok backend URL and share ngrok frontend URL.

## Troubleshooting

**CORS Error**: Ensure `FRONTEND_URL` in backend matches exact frontend URL (with https://)

**API Not Found**: Check `VITE_API_URL` in frontend environment variables

**Build Failed**: Check build logs in Render dashboard

**Database Error**: SQLite works on Render, but data is temporary on free tier
