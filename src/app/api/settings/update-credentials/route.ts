import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { sendCredentialsEmail } from '@/lib/emailService';
import { getCurrentCredentials, updateCredentials, validateCredentials } from '@/lib/credentialsManager';

// Simple email sending function (using the email service)
async function sendEmailBackup(email: string, username: string, password: string) {
  try {
    const success = await sendCredentialsEmail({
      username,
      password,
      backupEmail: email
    });
    
    if (success) {
      console.log('✅ Backup email sent successfully to:', email);
      return true;
    } else {
      console.log('❌ Failed to send backup email');
      return false;
    }
  } catch (error) {
    console.error('❌ Email service error:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({ req: request });
    if (!token || token.role !== 'admin') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { currentPassword, newUsername, newPassword, backupEmail } = await request.json();

    // Validate input
    if (!currentPassword || !newUsername || !newPassword || !backupEmail) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: 'New password must be at least 6 characters' },
        { status: 400 }
      );
    }

    if (!backupEmail.includes('@')) {
      return NextResponse.json(
        { message: 'Invalid backup email address' },
        { status: 400 }
      );
    }

    // Verify current password with dynamic credentials
    const currentCredentials = getCurrentCredentials();
    
    // Validate using current username from credentials file, not from token
    if (!validateCredentials(currentCredentials.username, currentPassword)) {
      return NextResponse.json(
        { message: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Update credentials using credentials manager
    const updateSuccess = updateCredentials(newUsername, newPassword);
    
    if (!updateSuccess) {
      return NextResponse.json(
        { message: 'Failed to update credentials' },
        { status: 500 }
      );
    }

    // Send backup email
    await sendEmailBackup(backupEmail, newUsername, newPassword);

    // Log the update
    console.log('🔄 Credentials updated:', {
      oldUsername: currentCredentials.username,
      newUsername: newUsername,
      backupEmail: backupEmail,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      { 
        message: 'Credentials updated successfully',
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Error updating credentials:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
