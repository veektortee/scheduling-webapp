const bcrypt = require('bcryptjs');

// Test the password hash
const password = 'admin123';
const hash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewviUK1CXLaWhWH2';

bcrypt.compare(password, hash).then(result => {
  console.log(`Password "${password}" matches hash:`, result);
  
  // Also generate a new hash for verification
  bcrypt.hash(password, 12).then(newHash => {
    console.log('New hash for admin123:', newHash);
  });
});
