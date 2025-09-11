import nodemailer from 'nodemailer';

interface EmailCredentials {
  username: string;
  password: string;
  backupEmail: string;
}

export async function sendCredentialsEmail({ username, password, backupEmail }: EmailCredentials): Promise<boolean> {
  try {
    // For development, we'll log the email details and use a test SMTP service
    console.log('📧 === EMAIL SERVICE DEBUG ===');
    console.log('📧 Attempting to send credentials email...');
    console.log('📧 Recipient:', backupEmail);
    console.log('📧 Username:', username);
    console.log('📧 Password:', password);
    
    // For development/demonstration purposes, we'll use a test SMTP service
    // In production, you should use a real email service like SendGrid, AWS SES, etc.
    
    // Create a test account (this generates a temporary inbox)
    console.log('📧 Creating test email account...');
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

    // Email template
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Medical Scheduling System - New Credentials</title>
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
          <h1>🏥 Medical Scheduling System</h1>
          <p>Login Credentials Updated</p>
        </div>
        
        <div class="content">
          <h2>Your login credentials have been successfully updated!</h2>
          
          <div class="credentials">
            <h3>🔐 New Login Information</h3>
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
            <strong>⚠️ Security Notice:</strong>
            <ul>
              <li>Please store these credentials securely</li>
              <li>Consider using a password manager</li>
              <li>Do not share these credentials with anyone</li>
              <li>You have been automatically logged out of all sessions</li>
            </ul>
          </div>
          
          <p>You can now log in to the Medical Staff Scheduling System using these new credentials.</p>
          
          <p>If you did not request this change, please contact your system administrator immediately.</p>
        </div>
        
        <div class="footer">
          <p>This is an automated message from the Medical Staff Scheduling System.</p>
          <p>Timestamp: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const info = await transporter.sendMail({
      from: '"Medical Scheduling System" <noreply@scheduling.com>',
      to: backupEmail,
      subject: '🔐 Medical Scheduling System - Login Credentials Updated',
      html: htmlContent,
      text: `
Medical Staff Scheduling System - Credentials Updated

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

    console.log('📧 Email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    
    // For development, log the preview URL (this is where you can see the email)
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('📧 ✨ EMAIL PREVIEW URL (OPEN THIS TO SEE THE EMAIL):');
      console.log('📧 🔗', previewUrl);
      console.log('📧 ⚠️  NOTE: This is a TEST email service - emails are not sent to real addresses');
      console.log('📧 ⚠️  In production, configure a real email service like SendGrid or Gmail');
    }
    
    console.log('📧 === EMAIL SERVICE COMPLETE ===');

    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
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
