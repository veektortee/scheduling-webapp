import * as fs from 'fs';
import * as path from 'path';

interface UserCredentials {
  username: string;
  password: string;
  updatedAt: string;
}

const CREDENTIALS_FILE = path.join(process.cwd(), '.credentials.json');

// Initialize default credentials if file doesn't exist
function initializeCredentials() {
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

// Read current credentials
export function getCurrentCredentials(): UserCredentials {
  try {
    initializeCredentials();
    const data = fs.readFileSync(CREDENTIALS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error reading credentials:', error);
    // Return default if file read fails
    return {
      username: 'admin@scheduling.com',
      password: 'admin123',
      updatedAt: new Date().toISOString()
    };
  }
}

// Update credentials
export function updateCredentials(username: string, password: string): boolean {
  try {
    const newCredentials: UserCredentials = {
      username,
      password,
      updatedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(newCredentials, null, 2));
    console.log('✅ Credentials updated successfully');
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
    return currentCredentials.username === username && currentCredentials.password === password;
  } catch (error) {
    console.error('❌ Error validating credentials:', error);
    return false;
  }
}
