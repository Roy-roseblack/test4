# ULTRA ELITE Dashboard — Render Deployment Guide

## Quick Start

Your Node.js/Express app is ready to deploy to Render. Follow these steps to go live:

### Step 1: Authenticate with GitHub

First, set up authentication with GitHub so git can push:

```bash
# Option A: Personal Access Token (recommended for automation)
git config --global credential.helper store
# Then when prompted, use your GitHub username and a Personal Access Token

# Option B: SSH Key
# Generate SSH key and add to GitHub: https://docs.github.com/en/authentication/connecting-to-github-with-ssh

# Option C: GitHub CLI
gh auth login
```

After setting up authentication, push your code:

```bash
git push origin master
```

### Step 2: Connect Render to Your GitHub Repository

1. Go to [render.com](https://render.com) and sign up / log in
2. Click **New +** → **Web Service**
3. Select **Connect a repository**
4. Search for `website` and select `Roy-roseblack/website`
5. Click **Connect**

### Step 3: Configure Deployment Settings

Render will auto-detect your `render.yaml` file. Verify these settings:

- **Name**: `ultra-elite-dashboard` (or your preferred name)
- **Environment**: Node
- **Build Command**: `npm install`
- **Start Command**: `node host.js`
- **Plan**: Free (or upgrade to paid for better uptime/performance)

Environment variables are auto-configured:
- `NODE_ENV`: production
- `SESSION_SECRET`: auto-generated securely
- `PORT`: 3000

### Step 4: Deploy

Click **Deploy**. Render will:

1. Clone your repository
2. Run `npm install`
3. Start your app with `node host.js`
4. Assign a permanent URL like `https://ultra-elite-dashboard.onrender.com`

Deployment takes 2-5 minutes. Watch the logs for any errors.

### Step 5: Access Your Live App

Once deployed, your app will be live at:

```
https://ultra-elite-dashboard.onrender.com
```

Share this URL with anyone to access your ULTRA ELITE dashboard.

---

## Pre-Deployment Checklist

✅ **Code Quality**
- Database schema initialized automatically on first run
- No hardcoded secrets (using environment variables)
- Express app properly configured for production

✅ **Database**
- SQLite database created at startup
- All tables auto-created: `users`, `players`, `clans`
- Player profiles auto-created on user signup

✅ **Security**
- SESSION_SECRET generated securely by Render
- Production NODE_ENV set
- Password hashing with bcrypt

✅ **Features Ready**
- User registration and authentication
- Player stats dashboard
- Clan management
- Command center
- Theme customization
- All working features included

---

## Deployment Details

### What's Deployed

- **Framework**: Express.js
- **Database**: SQLite (file-based, included with your code)
- **Authentication**: BCrypt password hashing
- **Port**: 3000 (auto-mapped to HTTPS)
- **Start File**: `host.js`

### Environment Setup

The `render.yaml` file configures:

```yaml
services:
  - type: web
    name: ultra-elite-dashboard
    env: node
    buildCommand: npm install
    startCommand: node host.js
    envVars:
      - NODE_ENV: production
      - SESSION_SECRET: [auto-generated]
      - PORT: 3000
    autoDeploy: true  # Redeploys on every git push
```

### Database Persistence

Your SQLite database file (`website.sqlite`) is stored in the app's ephemeral filesystem. On a free Render plan, this means:

- Database resets when the app restarts (weekly or on redeployment)
- For production, upgrade to Render's PostgreSQL database

**For permanent data**, consider upgrading to:
- Render PostgreSQL database, OR
- External database service (e.g., Supabase, Railway)

---

## Testing Your Deployment

After the app goes live:

1. **Visit the dashboard**: https://ultra-elite-dashboard.onrender.com
2. **Test registration**: Create a new account
3. **Test login**: Sign in with your credentials
4. **Check dashboard**: View player stats and features
5. **Monitor logs**: Watch Render's log viewer for errors

---

## Troubleshooting

### Build Fails
- Check `npm install` output in Render logs
- Verify all dependencies are in `package.json`
- Ensure no ngrok commands run in production (only for local testing)

### App Won't Start
- Check `host.js` for syntax errors
- Verify `npm install` completed successfully
- Look for database permission issues in logs

### Database Issues
- SQLite file is automatically created on first run
- Tables are auto-created if missing
- Check `console.log` output in Render's log viewer

### Free Plan Limitations
- App spins down after 15 minutes of inactivity (cold start)
- Limited CPU/memory
- Data resets weekly
- For production, upgrade to paid plan or use persistent database

---

## Next Steps

1. **Push to GitHub** (authenticate first if needed)
2. **Create Render account** at render.com
3. **Connect your GitHub repo** to Render
4. **Deploy** and get your permanent URL
5. **Share the URL** with users

Your ULTRA ELITE dashboard will be live and accessible worldwide! 🚀

---

## Support & Documentation

- **Render Docs**: https://render.com/docs
- **Express.js Docs**: https://expressjs.com
- **SQLite Docs**: https://www.sqlite.org/docs.html
- **Render Status**: https://status.render.com
