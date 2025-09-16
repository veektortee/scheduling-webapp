# [Secure] Authentication Troubleshooting Guide

## Problem: NextAuth 500 Server Error on Vercel

### Symptoms
- [Error] `Failed to load resource: the server responded with a status of 500`
- [Error] `[next-auth][error][CLIENT_FETCH_ERROR]`
- [Error] Authentication works locally but fails on Vercel deployment

### Root Cause
The NextAuth configuration is missing required environment variables for production deployment.

## [Done] Solution Steps

### 1. Set Environment Variables in Vercel

Go to your Vercel project dashboard:
1. **Project Settings** → **Environment Variables**
2. **Add the following variables:**

```bash
NEXTAUTH_URL=https://your-actual-vercel-domain.vercel.app
NEXTAUTH_SECRET=your-generated-32-char-secret
ADMIN_EMAIL=admin@scheduling.com
ADMIN_PASSWORD_HASH=$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewviUK1CXLaWhWH2
```

### 2. Generate a Secure NEXTAUTH_SECRET

Run this command to generate a secure secret:
```bash
node generate-secret.mjs
```

Or generate manually:
```bash
openssl rand -base64 32
```

### 3. Update NEXTAUTH_URL

[Warning] **Critical**: Replace `https://your-actual-vercel-domain.vercel.app` with your **exact** Vercel URL.

Example:
- [Done] `https://scheduling-webapp-abc123.vercel.app`
- [Error] `http://localhost:3000` (wrong for production)
- [Error] `https://yourapp.com` (if that's not your actual domain)

### 4. Redeploy Your Application

After setting environment variables:
```bash
# Trigger a new deployment
vercel --prod
```

Or push a commit to trigger automatic deployment.

## [Info] How to Verify the Fix

### Check Vercel Function Logs
1. Go to Vercel Dashboard → Your Project
2. Click **Functions** tab
3. Look for `/api/auth/[...nextauth]` function
4. Check recent logs for errors

### Test Authentication
1. Visit your Vercel app URL
2. Try to login with:
   - **Email**: `admin@scheduling.com`
   - **Password**: `admin123`
3. Should successfully redirect to main app

## 🚨 Common Mistakes

### [Error] Wrong NEXTAUTH_URL
```bash
# DON'T USE:
NEXTAUTH_URL=http://localhost:3000              # Local only
NEXTAUTH_URL=https://vercel.app                 # Too generic
NEXTAUTH_URL=https://myapp.com                  # Wrong domain

# USE YOUR ACTUAL VERCEL URL:
NEXTAUTH_URL=https://your-project-hash.vercel.app
```

### [Error] Missing or Weak NEXTAUTH_SECRET
```bash
# DON'T USE:
NEXTAUTH_SECRET=secret                          # Too weak
NEXTAUTH_SECRET=123456                          # Too weak
# (missing completely)                          # Will cause 500 error

# USE A STRONG SECRET:
NEXTAUTH_SECRET=abcd1234efgh5678ijkl9012mnop3456  # 32+ chars
```

### [Error] Incorrect Environment Variable Names
```bash
# DON'T USE:
NEXT_AUTH_SECRET=...                            # Wrong name
AUTH_SECRET=...                                 # Wrong name
NEXTAUTH_TOKEN=...                              # Wrong name

# USE EXACT NAMES:
NEXTAUTH_SECRET=...                             # Correct
NEXTAUTH_URL=...                                # Correct
```

## 🧪 Testing Locally vs Production

### Local Development (.env.local)
```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=development-secret-key
```

### Production (Vercel Dashboard)
```bash
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=production-secret-32-chars-min
```

## 📞 Still Having Issues?

1. **Check browser Network tab** for 500 errors
2. **Verify environment variables** are saved in Vercel
3. **Clear browser cache** and cookies
4. **Check Vercel function logs** for detailed errors
5. **Ensure all environment variables** are set correctly

---

[Note] **Pro Tip**: Always use different `NEXTAUTH_SECRET` values for development and production!
