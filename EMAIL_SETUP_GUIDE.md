# Email Service Configuration Guide

## [Feature] Production Email Setup

Your email service has been **successfully updated** to support **real email delivery** instead of development previews!

## [Done] What Changed

- **Production email transporter** with Gmail, Outlook, SendGrid, and custom SMTP support
- **Dynamic sender addresses** based on your email provider
- **Automatic fallback** to development mode if production setup fails
- **Real email delivery** to backup email addresses

---

## [Maintenance] Configuration Options

### Option 1: Gmail (Recommended for Testing)

Create or update your `.env.local` file with:

```env
# Gmail Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASS=your-app-password

# Optional: Customize sender info
EMAIL_FROM_NAME=Medical Scheduling System
# Email features have been removed from this application. EMAIL_FROM_ADDRESS is no longer used.
```

**Setup Gmail App Password:**
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification if not already enabled
3. Generate an "App Password" for "Mail"
4. Use this 16-character password (not your regular Gmail password)

### Option 2: Microsoft Outlook/Hotmail

```env
# Outlook Configuration
EMAIL_SERVICE=outlook
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password

# Optional: Customize sender info
EMAIL_FROM_NAME=Medical Scheduling System
# deprecated
```

### Option 3: SendGrid (Professional/Production)

```env
# SendGrid Configuration
EMAIL_SERVICE=sendgrid
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key

# Required: Verified sender email
EMAIL_FROM_NAME=Medical Scheduling System
# deprecated
```

### Option 4: Custom SMTP

```env
# Custom SMTP Configuration
EMAIL_HOST=smtp.yourmailserver.com
EMAIL_PORT=587
EMAIL_SECURE=true
EMAIL_USER=your-email@yourdomain.com
EMAIL_PASS=your-password

# Required: Sender info
EMAIL_FROM_NAME=Medical Scheduling System
# deprecated
```

---

## 🧪 Testing Your Configuration

### 1. Start Your Development Server
```powershell
npm run dev
```

### 2. Test Credential Recovery
1. Go to the login page
2. Try logging in with wrong credentials (to trigger the "Forgot credentials?" option)
3. Click "Forgot credentials?" and enter a backup email
4. Check your email inbox for the recovery email

### 3. Test Credential Updates
1. Log in successfully
2. Go to Settings page
3. Update your backup email address
4. Check both old and new backup emails for notifications

---

## [Info] Troubleshooting

### Email Not Being Sent?

1. **Check Console Logs:**
   - Look for "📧 Production email sent successfully!" messages
   - Error messages will show authentication or configuration issues

2. **Verify Environment Variables:**
   ```powershell
   # In PowerShell, check if variables are loaded:
   $env:EMAIL_SERVICE
   $env:EMAIL_USER
   ```

3. **Common Issues:**
   - **Gmail:** Make sure you're using an App Password, not your regular password
   - **Outlook:** Some accounts require "Less secure app access" to be enabled
   - **SendGrid:** Verify your sender email is authenticated
   - **SMTP:** Check firewall/port settings for custom SMTP servers

### Still Getting Preview URLs?

If you still see "Ethereal Email preview URLs" in the console, it means:
- Environment variables aren't loaded properly
- The email service is falling back to development mode
- Restart your development server after adding `.env.local`

---

## 📧 Email Features Now Active

### 1. Credential Recovery Emails
- **Subject:** "[Secure] SECURITY ALERT - Medical Scheduling System Credential Recovery"
- **Sent to:** User's backup email
- **Contains:** Recovery token and login instructions
- **Professional HTML styling** with security warnings

### 2. Dual Email Notifications (During Credential Updates)
- **Old backup email:** Security alert about credential changes
- **New backup email:** Welcome message with new credentials
- **Both include:** Complete login credentials and security information

---

## � Security Features

- [Done] **Rate limiting** prevents spam/abuse of recovery system
- [Done] **Dual notifications** keep both old and new backup emails informed
- [Done] **Secure tokens** for credential recovery (time-limited, one-use)
- [Done] **HTML + Text versions** work in all email clients
- [Done] **Professional styling** with consistent branding

---

## 📞 Next Steps

1. **Choose your preferred email service** (Gmail is easiest for testing)
2. **Add the environment variables** to your `.env.local` file
3. **Restart your development server**
4. **Test the email functionality** using the steps above

The system will automatically detect your configuration and switch from development previews to real email delivery!

---

## [Feature] Production Deployment

When you deploy to production:
- **Vercel:** Add environment variables in Settings > Environment Variables
- **Other platforms:** Set the same environment variables in your hosting configuration

The system is now ready to send real emails to your users' backup email addresses!