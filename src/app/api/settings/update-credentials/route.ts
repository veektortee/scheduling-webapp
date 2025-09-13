import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { sendCredentialsEmail, sendCredentialsToBothEmails } from '@/lib/emailService';
import { getCurrentCredentials, updateCredentials, validateCredentials } from '@/lib/credentialsManager';

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
    
    // Store the old backup email before updating
    const oldBackupEmail = currentCredentials.backupEmail || '';
    
    // Validate using current username from credentials file, not from token
    if (!validateCredentials(currentCredentials.username, currentPassword)) {
      return NextResponse.json(
        { message: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Update credentials using credentials manager (now includes backup email)
    const updateSuccess = updateCredentials(newUsername, newPassword, backupEmail);
    
    if (!updateSuccess) {
      return NextResponse.json(
        { message: 'Failed to update credentials' },
        { status: 500 }
      );
    }

    // Send backup emails to both old and new addresses
    let emailSuccess = false;
    if (oldBackupEmail && oldBackupEmail !== backupEmail) {
      // Different emails - send to both for security
      emailSuccess = await sendCredentialsToBothEmails(newUsername, newPassword, oldBackupEmail, backupEmail);
    } else {
      // Same email or no previous email - send to current backup email only
      emailSuccess = await sendCredentialsEmail({
        username: newUsername,
        password: newPassword,
        backupEmail: backupEmail
      });
    }

    if (!emailSuccess) {
  console.log('[ERROR] Failed to send backup emails, but credentials were updated');
    }

    // Log the update
  console.log('[INFO] Credentials updated:', {
      oldUsername: currentCredentials.username,
      newUsername: newUsername,
      oldBackupEmail: oldBackupEmail,
      newBackupEmail: backupEmail,
      emailsSentToBoth: oldBackupEmail && oldBackupEmail !== backupEmail,
      timestamp: new Date().toISOString()
    });

    const successMessage = oldBackupEmail && oldBackupEmail !== backupEmail
      ? 'Credentials updated successfully! Emails sent to both old and new backup addresses for security.'
      : 'Credentials updated successfully! Email sent to your backup address.';

    return NextResponse.json(
      { 
        message: successMessage,
        sentToBothEmails: oldBackupEmail && oldBackupEmail !== backupEmail,
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );

  } catch (error) {
  console.error('[ERROR] Error updating credentials:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
