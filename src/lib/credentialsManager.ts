import * as fs from 'fs';
import * as path from 'path';

interface UserCredentials {
  username: string;
  password: string;
  backupEmail?: string;
  updatedAt: string;
}

const CREDENTIALS_FILE = path.join(process.cwd(), '.credentials.json');

// Check if we're running in a serverless environment
const isServerlessEnvironment = () => {
  return process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT;
};

// Initialize default credentials if file doesn't exist (local development only)
function initializeCredentials() {
  if (isServerlessEnvironment()) {
    console.log('🌐 Running in serverless environment - using environment variables');
    return;
  }

  if (!fs.existsSync(CREDENTIALS_FILE)) {
    const defaultCredentials: UserCredentials = {
      username: 'admin@scheduling.com',
      password: 'admin123',
      updatedAt: new Date().toISOString()
    };
    
    try {
      fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(defaultCredentials, null, 2));
      console.log('✅ Initialized default user credentials');
    } catch (error) {
      console.error('❌ Failed to create credentials file:', error);
    }
  }
}

// Read current credentials from environment variables or file
export function getCurrentCredentials(): UserCredentials {
  // In serverless environments, use environment variables
  if (isServerlessEnvironment()) {
    console.log('🌐 Loading credentials from environment variables');
    return {
      username: process.env.ADMIN_USERNAME || 'admin@scheduling.com',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      backupEmail: process.env.ADMIN_BACKUP_EMAIL,
      updatedAt: process.env.CREDENTIALS_UPDATED_AT || new Date().toISOString()
    };
  }

  // For local development, try file-based storage first
  try {
    initializeCredentials();
    if (fs.existsSync(CREDENTIALS_FILE)) {
      const data = fs.readFileSync(CREDENTIALS_FILE, 'utf8');
      const fileCredentials = JSON.parse(data);
      console.log('📁 Loaded credentials from file');
      return fileCredentials;
    }
  } catch (error) {
    console.error('❌ Error reading credentials file:', error);
  }

  // Fallback to environment variables even in development
  console.log('🔄 Falling back to environment variables');
  return {
    username: process.env.ADMIN_USERNAME || 'admin@scheduling.com',
    password: process.env.ADMIN_PASSWORD || 'admin123',
    backupEmail: process.env.ADMIN_BACKUP_EMAIL,
    updatedAt: process.env.CREDENTIALS_UPDATED_AT || new Date().toISOString()
  };
}

// Update credentials
export function updateCredentials(username: string, password: string, backupEmail?: string): boolean {
  // In serverless environments, credentials cannot be updated at runtime
  if (isServerlessEnvironment()) {
    console.log('⚠️ Cannot update credentials in serverless environment - use environment variables instead');
    console.log('🔧 To update credentials in production:');
    console.log('   - Set ADMIN_USERNAME environment variable');
    console.log('   - Set ADMIN_PASSWORD environment variable');
    console.log('   - Set ADMIN_BACKUP_EMAIL environment variable (optional)');
    console.log('   - Set CREDENTIALS_UPDATED_AT environment variable');
    return false;
  }

  // For local development, update the file
  try {
    const newCredentials: UserCredentials = {
      username,
      password,
      backupEmail,
      updatedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(newCredentials, null, 2));
    console.log('✅ Credentials updated successfully in local file');
    return true;
  } catch (error) {
    console.error('❌ Error updating credentials:', error);
    return false;
  }
}

// Validate credentials
export function validateCredentials(username: string, password: string): boolean {
  try {
    const currentCredentials = getCurrentCredentials();
    const isValid = currentCredentials.username === username && currentCredentials.password === password;
    console.log('🔍 Credential validation:', {
      environment: isServerlessEnvironment() ? 'serverless' : 'local',
      providedUsername: username,
      isValid
    });
    return isValid;
  } catch (error) {
    console.error('❌ Error validating credentials:', error);
    return false;
  }
}

// Get backup email (for security, only return if it exists)
export function getBackupEmail(): string | null {
  try {
    const currentCredentials = getCurrentCredentials();
    return currentCredentials.backupEmail || null;
  } catch (error) {
    console.error('❌ Error retrieving backup email:', error);
    return null;
  }
}

// Check if backup email is configured
export function isBackupEmailConfigured(): boolean {
  try {
    const backupEmail = getBackupEmail();
    const isConfigured = !!backupEmail && backupEmail.includes('@');
    console.log('📧 Backup email check:', {
      environment: isServerlessEnvironment() ? 'serverless' : 'local',
      isConfigured,
      hasEmail: !!backupEmail
    });
    return isConfigured;
  } catch (error) {
    console.error('❌ Error checking backup email configuration:', error);
    return false;
  }
}

// Generate a secure recovery token (for additional security)
export function generateRecoveryToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
