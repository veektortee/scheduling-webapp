#!/usr/bin/env node

/**
 * Vercel Environment Variable Setup Script
 * 
 * This script helps set up the required environment variables for the
 * scheduling webapp authentication system on Vercel.
 */

import crypto from 'crypto';

// Generate secure credentials
function generateSecurePassword(length = 16) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

function generateNextAuthSecret() {
  return crypto.randomBytes(32).toString('base64');
}

function getCurrentTimestamp() {
  return new Date().toISOString();
}

console.log('🔐 Vercel Environment Variables Setup');
console.log('=====================================\n');

console.log('Here are the environment variables you need to set in your Vercel project:\n');

// Generate sample values
const sampleUsername = 'admin@yourcompany.com';
const samplePassword = generateSecurePassword(20);
const sampleBackupEmail = 'backup@yourcompany.com';
const nextAuthSecret = generateNextAuthSecret();
const timestamp = getCurrentTimestamp();

console.log('📋 Copy these values to your Vercel project settings:');
console.log('------------------------------------------------------');
console.log(`ADMIN_USERNAME=${sampleUsername}`);
console.log(`ADMIN_PASSWORD=${samplePassword}`);
console.log(`ADMIN_BACKUP_EMAIL=${sampleBackupEmail}`);
console.log(`CREDENTIALS_UPDATED_AT=${timestamp}`);
console.log(`NEXTAUTH_SECRET=${nextAuthSecret}`);
console.log('NEXTAUTH_URL=https://your-app-name.vercel.app\n');

console.log('🔧 Vercel CLI Commands:');
console.log('-----------------------');
console.log(`vercel env add ADMIN_USERNAME production`);
console.log(`# Enter: ${sampleUsername}\n`);

console.log(`vercel env add ADMIN_PASSWORD production`);
console.log(`# Enter: ${samplePassword}\n`);

console.log(`vercel env add ADMIN_BACKUP_EMAIL production`);
console.log(`# Enter: ${sampleBackupEmail}\n`);

console.log(`vercel env add CREDENTIALS_UPDATED_AT production`);
console.log(`# Enter: ${timestamp}\n`);

console.log(`vercel env add NEXTAUTH_SECRET production`);
console.log(`# Enter: ${nextAuthSecret}\n`);

console.log(`vercel env add NEXTAUTH_URL production`);
console.log('# Enter: https://your-app-name.vercel.app\n');

console.log('📝 Local Development (.env.local):');
console.log('-----------------------------------');
console.log(`ADMIN_USERNAME=${sampleUsername}`);
console.log(`ADMIN_PASSWORD=${samplePassword}`);
console.log(`ADMIN_BACKUP_EMAIL=${sampleBackupEmail}`);
console.log(`CREDENTIALS_UPDATED_AT=${timestamp}`);
console.log(`NEXTAUTH_SECRET=${nextAuthSecret}`);
console.log('NEXTAUTH_URL=http://localhost:3000\n');

console.log('⚠️  Important Notes:');
console.log('------------------');
console.log('1. Replace the sample email addresses with your actual email addresses');
console.log('2. Save the generated password in a secure location');
console.log('3. Replace "your-app-name" with your actual Vercel app name');
console.log('4. Set these variables for Production, Preview, and Development environments');
console.log('5. Redeploy your application after setting the environment variables\n');

console.log('🔍 Testing:');
console.log('----------');
console.log('After setting the environment variables and redeploying:');
console.log('1. Try logging in with the new credentials');
console.log('2. Check the Vercel function logs for environment variable loading messages');
console.log('3. Test credential recovery if you set a backup email\n');

console.log('✅ Setup complete! Copy the values above to your Vercel project settings.');