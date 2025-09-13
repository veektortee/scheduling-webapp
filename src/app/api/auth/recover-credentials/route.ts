import { NextRequest, NextResponse } from 'next/server';
import { lockoutManager } from '@/lib/lockoutManager';
import { getCurrentCredentials, getBackupEmail, isBackupEmailConfigured, generateRecoveryToken } from '@/lib/credentialsManager';
import { sendCredentialRecoveryEmail } from '@/lib/emailService';

export async function POST(request: NextRequest) {
  try {
  console.log('[RECOVERY] === CREDENTIAL RECOVERY REQUEST ===');
    console.log('🌐 Environment:', {
      isVercel: !!process.env.VERCEL,
      nodeEnv: process.env.NODE_ENV,
      hasBackupEmail: !!process.env.ADMIN_BACKUP_EMAIL
    });
    
    // Check if the request is locked out
    if (lockoutManager.isLockedOut(request)) {
      const lockoutInfo = lockoutManager.getLockoutInfo(request);
  console.log('[SECURITY] Recovery request blocked due to lockout:', lockoutInfo);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Too many failed attempts. Please wait before trying again.',
          lockoutInfo: {
            isLockedOut: lockoutInfo.isLockedOut,
            formattedTime: lockoutInfo.remainingTime 
              ? lockoutManager.getFormattedRemainingTime(lockoutInfo.remainingTime)
              : undefined
          }
        },
        { status: 429 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { confirmRecovery } = body;

    // Verify this is a legitimate recovery request
    if (!confirmRecovery) {
  console.log('[ERROR] Invalid recovery request - missing confirmation');
      lockoutManager.recordFailedAttempt(request);
      return NextResponse.json(
        { success: false, error: 'Invalid recovery request' },
        { status: 400 }
      );
    }

    // Check if backup email is configured
    if (!isBackupEmailConfigured()) {
  console.log('[ERROR] Recovery failed - no backup email configured');
      console.log('🔧 Environment variables check:', {
        hasAdminBackupEmail: !!process.env.ADMIN_BACKUP_EMAIL,
        adminBackupEmail: process.env.ADMIN_BACKUP_EMAIL ? 'SET' : 'NOT SET'
      });
      lockoutManager.recordFailedAttempt(request);
      return NextResponse.json(
        { 
          success: false, 
          error: process.env.VERCEL 
            ? 'No backup email configured. Please set the ADMIN_BACKUP_EMAIL environment variable in your Vercel project settings.'
            : 'No backup email configured. Please contact your system administrator.'
        },
        { status: 400 }
      );
    }

    // Get current credentials and backup email
    const credentials = getCurrentCredentials();
    const backupEmail = getBackupEmail();

    if (!backupEmail) {
  console.log('[ERROR] Recovery failed - backup email not found');
      lockoutManager.recordFailedAttempt(request);
      return NextResponse.json(
        { success: false, error: 'Backup email not found. Please contact your system administrator.' },
        { status: 500 }
      );
    }

    // Generate a unique recovery token for security tracking
    const recoveryToken = generateRecoveryToken();
    
  console.log('[RECOVERY] Recovery details:');
  console.log('[RECOVERY] Username:', credentials.username);
  console.log('[RECOVERY] Backup email:', backupEmail);
  console.log('[RECOVERY] Recovery token:', recoveryToken);
  console.log('[RECOVERY] Request IP:', request.headers.get('x-forwarded-for') || 'unknown');
  console.log('[RECOVERY] Request time:', new Date().toISOString());

    // Send the recovery email
    const emailSent = await sendCredentialRecoveryEmail(
      credentials.username,
      credentials.password,
      backupEmail,
      recoveryToken
    );

    if (!emailSent) {
  console.log('[ERROR] Failed to send recovery email');
      return NextResponse.json(
        { success: false, error: 'Failed to send recovery email. Please contact your system administrator.' },
        { status: 500 }
      );
    }

    // Reset any previous failed attempts on successful recovery
    lockoutManager.resetAttempts(request);

  console.log('[SUCCESS] Credential recovery email sent successfully');
  console.log('[RECOVERY] === CREDENTIAL RECOVERY COMPLETE ===');

    // Return success response with masked email for security
    const maskedEmail = maskEmail(backupEmail);
    return NextResponse.json({
      success: true,
      message: `Recovery email sent successfully to ${maskedEmail}`,
      recoveryToken, // Include token in response for verification if needed
      timestamp: new Date().toISOString()
    });

  } catch (error) {
  console.error('[ERROR] Credential recovery error:', error);
    
    // Record failed attempt on error
    lockoutManager.recordFailedAttempt(request);
    
    return NextResponse.json(
      { success: false, error: 'An error occurred during credential recovery. Please try again later.' },
      { status: 500 }
    );
  }
}

// Helper function to mask email for security
function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 3) {
    return `${localPart[0]}***@${domain}`;
  }
  return `${localPart.substring(0, 2)}***${localPart.slice(-1)}@${domain}`;
}

// GET method to check if recovery is available
export async function GET(request: NextRequest) {
  try {
    // Check lockout status
    const lockoutInfo = lockoutManager.getLockoutInfo(request);
    if (lockoutInfo.isLockedOut) {
      return NextResponse.json({
        available: false,
        reason: 'locked_out',
        remainingTime: lockoutInfo.remainingTime,
        formattedTime: lockoutInfo.remainingTime 
          ? lockoutManager.getFormattedRemainingTime(lockoutInfo.remainingTime)
          : undefined
      });
    }

    // Check if backup email is configured
    const isConfigured = isBackupEmailConfigured();
    if (!isConfigured) {
      return NextResponse.json({
        available: false,
        reason: 'no_backup_email'
      });
    }

    // Get masked backup email
    const backupEmail = getBackupEmail();
    const maskedEmail = backupEmail ? maskEmail(backupEmail) : null;

    return NextResponse.json({
      available: true,
      backupEmail: maskedEmail
    });

  } catch (error) {
  console.error('[ERROR] Error checking recovery availability:', error);
    return NextResponse.json(
      { available: false, reason: 'error' },
      { status: 500 }
    );
  }
}