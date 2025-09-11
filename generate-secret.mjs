#!/usr/bin/env node

/**
 * Generate a secure NEXTAUTH_SECRET for production use
 * Run with: node generate-secret.js
 */

import crypto from 'crypto';

function generateSecret() {
  return crypto.randomBytes(32).toString('base64');
}

const secret = generateSecret();

console.log('\n🔐 Generated NEXTAUTH_SECRET:');
console.log('================================');
console.log(secret);
console.log('================================');
console.log('\n📋 Add this to your Vercel environment variables:');
console.log(`NEXTAUTH_SECRET=${secret}`);
console.log('\n⚠️  Keep this secret secure and never commit it to git!');
console.log('💡 This secret should be at least 32 characters long.');
