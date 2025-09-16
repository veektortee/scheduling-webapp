// Email functionality has been disabled per configuration to remove any mail-related features.
// This file provides no-op implementations of the previously exported email functions so
// callers across the codebase continue to work without sending emails or requiring nodemailer.

/* eslint-disable @typescript-eslint/no-unused-vars */

export async function sendCredentialsEmail(_: { username: string; password: string; backupEmail: string; }): Promise<boolean> {
  console.log('[EMAIL][DISABLED] sendCredentialsEmail called - email sending disabled by configuration');
  return true;
}

export async function sendCredentialsEmailProduction(_: { username: string; password: string; backupEmail: string; }): Promise<boolean> {
  console.log('[EMAIL][DISABLED] sendCredentialsEmailProduction called - email sending disabled by configuration');
  return true;
}

export async function sendCredentialRecoveryEmail(_: string, __: string, ___: string, ____: string): Promise<boolean> {
  console.log('[EMAIL][DISABLED] sendCredentialRecoveryEmail called - email sending disabled by configuration');
  return true;
}

export async function sendCredentialsToBothEmails(_: string, __: string, ___: string, ____: string): Promise<boolean> {
  console.log('[EMAIL][DISABLED] sendCredentialsToBothEmails called - email sending disabled by configuration');
  return true;
}

export default {
  sendCredentialsEmail,
  sendCredentialsEmailProduction,
  sendCredentialRecoveryEmail,
  sendCredentialsToBothEmails
};
