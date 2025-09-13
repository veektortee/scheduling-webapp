import nodemailer from 'nodemailer';

interface EmailCredentials {
  username: string;
  password: string;
  backupEmail: string;
}

// Create transporter based on environment configuration
function createEmailTransporter() {
  const emailService = process.env.EMAIL_SERVICE || 'development';
  
  console.log(`[EMAIL] Configuring email service: ${emailService}`);

  switch (emailService.toLowerCase()) {
    case 'gmail':
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD
        }
      });

    case 'outlook':
    case 'hotmail':
      return nodemailer.createTransport({
        service: 'hotmail',
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD
        }
      });

    case 'sendgrid':
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY
        }
      });

    case 'smtp':
      // Custom SMTP configuration
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USERNAME,
          pass: process.env.SMTP_PASSWORD
        }
      });

    default:
      // Development mode - use test account
      console.log('[EMAIL] [DEV] Using DEVELOPMENT mode - emails will not be sent to real addresses');
      return null; // Will be handled separately for development
  }
}

async function createDevelopmentTransporter() {
  console.log('[EMAIL] Creating test email account for development...');
  const testAccount = await nodemailer.createTestAccount();
  console.log('[EMAIL] Test account created:', testAccount.user);
  
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });
}

export async function sendCredentialsEmail({ username, password, backupEmail }: EmailCredentials): Promise<boolean> {
  try {
    console.log('[EMAIL] === EMAIL SERVICE ===');
    console.log('[EMAIL] Attempting to send credentials email...');
    console.log('[EMAIL] Recipient:', backupEmail);
    console.log('[EMAIL] Username:', username);
    
    // Create appropriate transporter
    let transporter = createEmailTransporter();
    let isDevelopment = false;
    
    if (!transporter) {
      // Development mode
      transporter = await createDevelopmentTransporter();
      isDevelopment = true;
    }

    // Get sender information
    const fromName = process.env.EMAIL_FROM_NAME || 'Staff Scheduling System';
    const fromAddress = process.env.EMAIL_FROM_ADDRESS || 'noreply@scheduling.com';
    const fromEmail = `"${fromName}" <${fromAddress}>`;

    // Email template
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Staff Scheduling System - New Credentials</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3B82F6, #1D4ED8); color: white; text-align: center; padding: 30px; border-radius: 10px 10px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
        .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        .credential-item { margin: 10px 0; padding: 10px; background: #e5e7eb; border-radius: 4px; }
        .label { font-weight: bold; color: #374151; }
        .value { font-family: monospace; color: #1f2937; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>� Staff Scheduling System</h1>
          <p>Login Credentials Updated</p>
        </div>
        
        <div class="content">
          <h2>Your login credentials have been successfully updated!</h2>
          
          <div class="credentials">
            <h3>[SECURITY] New Login Information</h3>
            <div class="credential-item">
              <div class="label">Username:</div>
              <div class="value">${username}</div>
            </div>
            <div class="credential-item">
              <div class="label">Password:</div>
              <div class="value">${password}</div>
            </div>
          </div>
          
          <div class="warning">
            <strong>[WARNING] Security Notice:</strong>
            <ul>
              <li>Please store these credentials securely</li>
              <li>Consider using a password manager</li>
              <li>Do not share these credentials with anyone</li>
              <li>You have been automatically logged out of all sessions</li>
            </ul>
          </div>
          
          <p>You can now log in to the Staff Scheduling System using these new credentials.</p>
          
          <p>If you did not request this change, please contact your system administrator immediately.</p>
        </div>
        
        <div class="footer">
          <p>This is an automated message from the Staff Scheduling System.</p>
          <p>Timestamp: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const info = await transporter.sendMail({
      from: fromEmail,
      to: backupEmail,
      subject: '[SECURITY] Scheduling System - Login Credentials Updated',
      html: htmlContent,
      text: `
Staff Scheduling System - Credentials Updated

Your login credentials have been successfully updated:

Username: ${username}
Password: ${password}

Security Notice:
- Please store these credentials securely
- Consider using a password manager
- Do not share these credentials with anyone
- You have been automatically logged out of all sessions

Timestamp: ${new Date().toLocaleString()}
      `
    });

    console.log('[EMAIL] Email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    
    // Handle development vs production logging
    if (isDevelopment) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log('📧 ✨ EMAIL PREVIEW URL (DEVELOPMENT MODE):');
        console.log('📧 🔗', previewUrl);
        console.log('📧 ⚠️  NOTE: This is DEVELOPMENT mode - email sent to test inbox');
        console.log('📧 ⚠️  To send real emails, configure EMAIL_SERVICE in .env.local');
      }
    } else {
      console.log('📧 ✅ PRODUCTION: Email sent to real address:', backupEmail);
      console.log('📧 📬 Email should arrive in recipient\'s inbox shortly');
    }
    
    console.log('📧 === EMAIL SERVICE COMPLETE ===');

    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    if (error instanceof Error) {
      console.error('❌ Error details:', error.message);
    }
    console.log('📧 === EMAIL SERVICE FAILED ===');
    return false;
  }
}

// Alternative function for production email services
export async function sendCredentialsEmailProduction({ username, password, backupEmail }: EmailCredentials): Promise<boolean> {
  try {
    // Example configuration for SendGrid
    // Uncomment and configure for production use
    
    /*
    const transporter = nodemailer.createTransport({
      service: 'SendGrid', // or your preferred service
      auth: {
        user: process.env.SENDGRID_USERNAME,
        pass: process.env.SENDGRID_PASSWORD
      }
    });
    */
    
    // Example configuration for Gmail
    /*
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD // Use App Password for Gmail
      }
    });
    */
    
    // For now, just log the credentials (replace with actual email sending in production)
    console.log('📧 [PRODUCTION] Would send email to:', backupEmail);
    console.log('📧 [PRODUCTION] New credentials:', { username, password });
    
    return true;
  } catch (error) {
    console.error('❌ Failed to send production email:', error);
    return false;
  }
}

// Secure credential recovery email service
export async function sendCredentialRecoveryEmail(username: string, password: string, backupEmail: string, recoveryToken: string): Promise<boolean> {
  try {
    console.log('📧 === CREDENTIAL RECOVERY EMAIL SERVICE ===');
    console.log('📧 Attempting to send credential recovery email...');
    console.log('📧 Recipient (backup email):', backupEmail);
    console.log('📧 Recovery token:', recoveryToken);
    
    // Create a test account for development
    const testAccount = await nodemailer.createTestAccount();
    console.log('📧 Test account created:', testAccount.user);
    
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });

    // Security-focused email template
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Staff Scheduling System - Credential Recovery</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #DC2626, #B91C1C); color: white; text-align: center; padding: 30px; border-radius: 10px 10px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
        .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #DC2626; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .security-alert { background: #fee2e2; border-left: 4px solid #DC2626; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        .credential-item { margin: 10px 0; padding: 10px; background: #e5e7eb; border-radius: 4px; }
        .label { font-weight: bold; color: #374151; }
        .value { font-family: monospace; color: #1f2937; font-size: 14px; }
        .token { font-family: monospace; font-size: 12px; color: #6b7280; word-break: break-all; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Staff Scheduling System</h1>
          <p>Credential Recovery Request</p>
        </div>
        
        <div class="content">
          <div class="security-alert">
            <strong>🚨 SECURITY ALERT:</strong>
            <p>Someone requested to recover the login credentials for your Staff Scheduling System account. This email was sent to your registered backup email address.</p>
          </div>
          
          <h2>Your Current Login Credentials</h2>
          
          <div class="credentials">
            <h3>🔑 Login Information</h3>
            <div class="credential-item">
              <div class="label">Username:</div>
              <div class="value">${username}</div>
            </div>
            <div class="credential-item">
              <div class="label">Password:</div>
              <div class="value">${password}</div>
            </div>
          </div>
          
          <div class="warning">
            <strong>⚠️ IMPORTANT SECURITY NOTICE:</strong>
            <ul>
              <li><strong>If you did NOT request this recovery, contact your system administrator immediately</strong></li>
              <li>This recovery request was made at: ${new Date().toLocaleString()}</li>
              <li>Consider changing your credentials if you suspect unauthorized access</li>
              <li>Never share these credentials with anyone</li>
              <li>Use a secure password manager to store these credentials</li>
            </ul>
          </div>
          
          <div class="security-alert">
            <strong>🛡️ Recovery Token:</strong>
            <div class="token">${recoveryToken}</div>
            <p><small>This token was generated for security tracking purposes.</small></p>
          </div>
          
          <p><strong>Next Steps:</strong></p>
          <ol>
            <li>Use the credentials above to log in to the system</li>
            <li>Consider updating your password once logged in</li>
            <li>Ensure your backup email is still valid</li>
          </ol>
          
          <p>If you have any concerns about this recovery request, please contact your system administrator immediately.</p>
        </div>
        
        <div class="footer">
          <p>This is an automated security message from the Staff Scheduling System.</p>
          <p>Recovery Token: ${recoveryToken}</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const info = await transporter.sendMail({
      from: '"Staff Scheduling System Security" <security@scheduling.com>',
      to: backupEmail,
      subject: '🔐 SECURITY ALERT - Staff Scheduling System Credential Recovery',
      html: htmlContent,
      text: `
SECURITY ALERT - Staff Scheduling System
Credential Recovery Request

Someone requested to recover the login credentials for your Scheduling System account.

Your Current Login Credentials:
Username: ${username}
Password: ${password}

IMPORTANT SECURITY NOTICE:
- If you did NOT request this recovery, contact your system administrator immediately
- This recovery request was made at: ${new Date().toLocaleString()}
- Consider changing your credentials if you suspect unauthorized access
- Never share these credentials with anyone
- Use a secure password manager to store these credentials

Recovery Token: ${recoveryToken}
Timestamp: ${new Date().toISOString()}

Next Steps:
1. Use the credentials above to log in to the system
2. Consider updating your password once logged in
3. Ensure your backup email is still valid

If you have any concerns about this recovery request, please contact your system administrator immediately.
      `
    });

    console.log('📧 Credential recovery email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    
    // For development, log the preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('📧 ✨ RECOVERY EMAIL PREVIEW URL:');
      console.log('📧 🔗', previewUrl);
      console.log('📧 ⚠️  NOTE: This is a TEST email service for development');
    }
    
    console.log('📧 === CREDENTIAL RECOVERY EMAIL COMPLETE ===');

    return true;
  } catch (error) {
    console.error('❌ Failed to send credential recovery email:', error);
    console.log('📧 === CREDENTIAL RECOVERY EMAIL FAILED ===');
    return false;
  }
}

// Send credentials to both old and new backup email addresses for security
export async function sendCredentialsToBothEmails(
  username: string, 
  password: string, 
  oldBackupEmail: string, 
  newBackupEmail: string
): Promise<boolean> {
  try {
    console.log('📧 === DUAL EMAIL CREDENTIAL SERVICE ===');
    console.log('📧 Sending credentials to both old and new backup emails...');
    console.log('📧 Old backup email:', oldBackupEmail);
    console.log('📧 New backup email:', newBackupEmail);
    console.log('📧 Username:', username);
    
    // Create appropriate transporter
    let transporter = createEmailTransporter();
    
    if (!transporter) {
      // Development mode
      transporter = await createDevelopmentTransporter();
    }

    // Get sender information
    const fromName = process.env.EMAIL_FROM_NAME || 'Staff Scheduling System';
    const fromAddress = process.env.EMAIL_FROM_ADDRESS || 'security@scheduling.com';
    const securityFromEmail = `"${fromName} Security" <${fromAddress}>`;
    const normalFromEmail = `"${fromName}" <${fromAddress}>`;

    // Email template for old backup email (security notification)
    const oldEmailHtmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Staff Scheduling System - Credentials Changed</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #DC2626, #B91C1C); color: white; text-align: center; padding: 30px; border-radius: 10px 10px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
        .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #DC2626; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .security-alert { background: #fee2e2; border-left: 4px solid #DC2626; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        .credential-item { margin: 10px 0; padding: 10px; background: #e5e7eb; border-radius: 4px; }
        .label { font-weight: bold; color: #374151; }
        .value { font-family: monospace; color: #1f2937; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Staff Scheduling System</h1>
          <p>Security Alert - Credentials Changed</p>
        </div>
        
        <div class="content">
          <div class="security-alert">
            <strong>🚨 SECURITY NOTIFICATION:</strong>
            <p>The login credentials for your Staff Scheduling System account have been changed, and the backup email has been updated to a new address.</p>
          </div>
          
          <h2>New Login Credentials</h2>
          
          <div class="credentials">
            <h3>🔑 Updated Login Information</h3>
            <div class="credential-item">
              <div class="label">New Username:</div>
              <div class="value">${username}</div>
            </div>
            <div class="credential-item">
              <div class="label">New Password:</div>
              <div class="value">${password}</div>
            </div>
            <div class="credential-item">
              <div class="label">New Backup Email:</div>
              <div class="value">${newBackupEmail}</div>
            </div>
          </div>
          
          <div class="warning">
            <strong>⚠️ IMPORTANT SECURITY NOTICE:</strong>
            <ul>
              <li><strong>This email was sent to your previous backup email address</strong></li>
              <li><strong>If you did NOT make these changes, contact your system administrator immediately</strong></li>
              <li>Future credential notifications will be sent to the new backup email: ${newBackupEmail}</li>
              <li>Keep these credentials secure and use a password manager</li>
              <li>You have been automatically logged out of all sessions</li>
            </ul>
          </div>
          
          <p>You can continue to use the above credentials to access the Staff Scheduling System.</p>
        </div>
        
        <div class="footer">
          <p>This is a security notification from the Staff Scheduling System.</p>
          <p>Sent to previous backup email for security purposes</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        </div>
      </div>
    </body>
    </html>
    `;

    // Email template for new backup email (welcome notification)
    const newEmailHtmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Staff Scheduling System - New Backup Email Configured</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #059669, #047857); color: white; text-align: center; padding: 30px; border-radius: 10px 10px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
        .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .welcome { background: #ecfdf5; border-left: 4px solid #059669; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        .credential-item { margin: 10px 0; padding: 10px; background: #e5e7eb; border-radius: 4px; }
        .label { font-weight: bold; color: #374151; }
        .value { font-family: monospace; color: #1f2937; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>� Staff Scheduling System</h1>
          <p>Welcome - New Backup Email Configured</p>
        </div>
        
        <div class="content">
          <div class="welcome">
            <strong>✅ WELCOME:</strong>
            <p>This email address has been set as the new backup email for the Staff Scheduling System. You will now receive important security notifications and credential recovery emails at this address.</p>
          </div>
          
          <h2>Your Current Login Credentials</h2>
          
          <div class="credentials">
            <h3>🔑 Login Information</h3>
            <div class="credential-item">
              <div class="label">Username:</div>
              <div class="value">${username}</div>
            </div>
            <div class="credential-item">
              <div class="label">Password:</div>
              <div class="value">${password}</div>
            </div>
            <div class="credential-item">
              <div class="label">Backup Email:</div>
              <div class="value">${newBackupEmail}</div>
            </div>
          </div>
          
          <div class="warning">
            <strong>⚠️ SECURITY INFORMATION:</strong>
            <ul>
              <li>This email address is now configured for credential recovery</li>
              <li>If you lose access to your account, you can use "Forgot your credentials?" on the login page</li>
              <li>Store these credentials securely using a password manager</li>
              <li>If you did not request this change, contact your system administrator</li>
              <li>The previous backup email also received a copy for security</li>
            </ul>
          </div>
          
          <p>You can now log in to the Staff Scheduling System using the credentials above.</p>
        </div>
        
        <div class="footer">
          <p>This is an automated message from the Staff Scheduling System.</p>
          <p>Sent to new backup email address</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const emailPromises = [];

    // Send to old backup email if it exists and is different from new one
    if (oldBackupEmail && oldBackupEmail !== newBackupEmail) {
      emailPromises.push(
        transporter.sendMail({
          from: securityFromEmail,
          to: oldBackupEmail,
          subject: '🚨 SECURITY ALERT - Staff Scheduling Credentials Changed',
          html: oldEmailHtmlContent,
          text: `
SECURITY ALERT - Staff Scheduling System
Credentials Changed

The login credentials for your Scheduling System account have been changed, and the backup email has been updated.

New Login Credentials:
Username: ${username}
Password: ${password}
New Backup Email: ${newBackupEmail}

IMPORTANT SECURITY NOTICE:
- This email was sent to your previous backup email address
- If you did NOT make these changes, contact your system administrator immediately
- Future notifications will be sent to: ${newBackupEmail}
- Keep these credentials secure and use a password manager

Timestamp: ${new Date().toISOString()}
          `
        })
      );
    }

    // Send to new backup email
    if (newBackupEmail) {
      emailPromises.push(
        transporter.sendMail({
          from: normalFromEmail,
          to: newBackupEmail,
          subject: '✅ Scheduling System - New Backup Email Configured',
          html: newEmailHtmlContent,
          text: `
Staff Scheduling System - New Backup Email Configured

This email address has been set as the new backup email for the Scheduling System.

Your Current Login Credentials:
Username: ${username}
Password: ${password}
Backup Email: ${newBackupEmail}

SECURITY INFORMATION:
- This email address is now configured for credential recovery
- If you lose access, use "Forgot your credentials?" on the login page
- Store these credentials securely using a password manager
- If you did not request this change, contact your system administrator

Timestamp: ${new Date().toISOString()}
          `
        })
      );
    }

    // Wait for all emails to be sent
    const results = await Promise.all(emailPromises);
    
    console.log('📧 All credential emails sent successfully!');
    
    // Log preview URLs for development
    results.forEach((result, index) => {
      const previewUrl = nodemailer.getTestMessageUrl(result);
      if (previewUrl) {
        const recipient = index === 0 && oldBackupEmail !== newBackupEmail ? oldBackupEmail : newBackupEmail;
        const type = index === 0 && oldBackupEmail !== newBackupEmail ? 'OLD' : 'NEW';
        console.log(`📧 ✨ ${type} EMAIL PREVIEW URL (${recipient}):`);
        console.log('📧 🔗', previewUrl);
      }
    });
    
    console.log('📧 === DUAL EMAIL CREDENTIAL SERVICE COMPLETE ===');

    return true;
  } catch (error) {
    console.error('❌ Failed to send credential emails:', error);
    console.log('📧 === DUAL EMAIL CREDENTIAL SERVICE FAILED ===');
    return false;
  }
}
