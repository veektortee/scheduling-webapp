# Vercel Environment Variables Setup

## Overview

The authentication system has been updated to work with Vercel's serverless environment. Credentials are now managed through environment variables instead of file-based storage.

## Required Environment Variables

Set the following environment variables in your Vercel project settings:

### Authentication Credentials
- `ADMIN_USERNAME`: The admin login email (e.g., `admin@scheduling.com`)
- `ADMIN_PASSWORD`: The admin login password (use a strong password)
- `ADMIN_BACKUP_EMAIL`: Optional backup email for credential recovery
- `CREDENTIALS_UPDATED_AT`: ISO timestamp of when credentials were last updated

### NextAuth Configuration
- `NEXTAUTH_SECRET`: Secret key for NextAuth (generate a secure random string)
- `NEXTAUTH_URL`: Your production URL (e.g., `https://your-app.vercel.app`)

## Setting Environment Variables in Vercel

### Method 1: Vercel Dashboard
1. Go to your project in the Vercel dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable with the appropriate values
4. Make sure to set them for Production, Preview, and Development environments

### Method 2: Vercel CLI
```bash
# Set production environment variables
vercel env add ADMIN_USERNAME production
vercel env add ADMIN_PASSWORD production
vercel env add ADMIN_BACKUP_EMAIL production
vercel env add CREDENTIALS_UPDATED_AT production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production
```

## Example Values

```bash
ADMIN_USERNAME=admin@yourcompany.com
ADMIN_PASSWORD=YourSecurePassword123!
ADMIN_BACKUP_EMAIL=backup@yourcompany.com
CREDENTIALS_UPDATED_AT=2024-01-15T10:30:00.000Z
NEXTAUTH_SECRET=your-super-secret-key-here
NEXTAUTH_URL=https://your-app.vercel.app
```

## Security Best Practices

1. **Strong Passwords**: Use a strong, unique password for the admin account
2. **Secure Secret**: Generate a strong random string for NEXTAUTH_SECRET (at least 32 characters)
3. **Backup Email**: Set up a backup email for credential recovery
4. **Regular Updates**: Update credentials periodically and update the CREDENTIALS_UPDATED_AT timestamp

## Local Development

For local development, you can either:

1. **Use .env.local file** (recommended):
   ```
   ADMIN_USERNAME=admin@scheduling.com
   ADMIN_PASSWORD=admin123
   ADMIN_BACKUP_EMAIL=your-backup@email.com
   CREDENTIALS_UPDATED_AT=2024-01-15T10:30:00.000Z
   NEXTAUTH_SECRET=your-development-secret
   NEXTAUTH_URL=http://localhost:3000
   ```

2. **Use file-based storage**: The system will automatically fall back to the `.credentials.json` file if environment variables are not set in development.

## Generating Secrets

### NEXTAUTH_SECRET
```bash
# Generate a secure random string
openssl rand -base64 32
# or
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Troubleshooting

### Common Issues
1. **Environment variables not loading**: Redeploy after setting environment variables
2. **Authentication failing**: Check that ADMIN_USERNAME and ADMIN_PASSWORD are set correctly
3. **Credential recovery not working**: Ensure ADMIN_BACKUP_EMAIL is set and valid

### Debug Information
The system logs detailed information about the environment and credential loading:
- Check Vercel function logs for authentication attempts
- Look for "Loading credentials from environment variables" messages
- Verify environment detection with "Running in serverless environment" logs

## Migration from File-Based System

If you were previously using the file-based credential system:

1. Check your current `.credentials.json` file for the username, password, and backup email
2. Set these values as environment variables in Vercel
3. Set CREDENTIALS_UPDATED_AT to the current timestamp
4. Deploy the updated code
5. Test authentication in production

## Security Notes

- Never commit actual credential values to your repository
- Use strong, unique passwords for production
- Regularly rotate your NEXTAUTH_SECRET and admin credentials
- Monitor authentication logs for suspicious activity
- Consider implementing additional security measures like IP whitelisting if needed