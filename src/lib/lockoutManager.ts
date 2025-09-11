// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RequestLike = any;

interface LoginAttempt {
  count: number;
  lastAttempt: number;
  lockUntil?: number;
}

interface LockoutConfig {
  maxAttempts: number;
  lockoutDuration: number; // in milliseconds
  resetWindow: number; // time window to reset attempts (in milliseconds)
}

class LockoutManager {
  private attempts = new Map<string, LoginAttempt>();
  private config: LockoutConfig = {
    maxAttempts: 3,
    lockoutDuration: 30 * 1000, // 30 seconds for first lockout
    resetWindow: 15 * 60 * 1000, // 15 minutes window to reset attempts
  };

  // Progressive lockout durations (in seconds)
  private getLockoutDuration(attemptCount: number): number {
    const durations = [30, 60, 300, 900, 1800]; // 30s, 1m, 5m, 15m, 30m
    const index = Math.min(Math.floor(attemptCount / this.config.maxAttempts) - 1, durations.length - 1);
    return durations[Math.max(0, index)] * 1000;
  }

  private getClientId(request?: RequestLike): string {
    // In production, you might want to use IP address + user agent
    // For now, using a simple approach suitable for single-admin systems
    if (request && request.headers) {
      try {
        // Handle both Request and NextAuth request types
        const getHeader = (name: string) => {
          if (typeof request.headers.get === 'function') {
            return request.headers.get(name);
          } else if (request.headers[name]) {
            return request.headers[name];
          }
          return null;
        };
        
        const forwarded = getHeader('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
        return `client_${ip}`;
      } catch (error) {
        console.warn('Error extracting client ID:', error);
      }
    }
    return 'default_client';
  }

  private cleanupOldAttempts(): void {
    const now = Date.now();
    for (const [key, attempt] of this.attempts.entries()) {
      // Remove attempts older than reset window
      if (now - attempt.lastAttempt > this.config.resetWindow) {
        this.attempts.delete(key);
      }
    }
  }

  recordFailedAttempt(request?: RequestLike): void {
    this.cleanupOldAttempts();
    
    const clientId = this.getClientId(request);
    const now = Date.now();
    const existing = this.attempts.get(clientId) || { count: 0, lastAttempt: 0 };

    // Reset count if enough time has passed
    if (now - existing.lastAttempt > this.config.resetWindow) {
      existing.count = 0;
    }

    existing.count += 1;
    existing.lastAttempt = now;

    // Apply lockout if max attempts reached
    if (existing.count >= this.config.maxAttempts) {
      existing.lockUntil = now + this.getLockoutDuration(existing.count);
    }

    this.attempts.set(clientId, existing);
  }

  isLockedOut(request?: RequestLike): boolean {
    this.cleanupOldAttempts();
    
    const clientId = this.getClientId(request);
    const attempt = this.attempts.get(clientId);
    
    if (!attempt || !attempt.lockUntil) {
      return false;
    }

    const now = Date.now();
    if (now >= attempt.lockUntil) {
      // Lockout expired, reset the attempt
      attempt.lockUntil = undefined;
      // Keep some attempts to maintain progressive lockout
      attempt.count = Math.max(0, attempt.count - 1);
      this.attempts.set(clientId, attempt);
      return false;
    }

    return true;
  }

  getLockoutInfo(request?: RequestLike): { isLockedOut: boolean; remainingTime?: number; attemptCount: number } {
    this.cleanupOldAttempts();
    
    const clientId = this.getClientId(request);
    const attempt = this.attempts.get(clientId);
    
    if (!attempt) {
      return { isLockedOut: false, attemptCount: 0 };
    }

    const now = Date.now();
    const isLockedOut = attempt.lockUntil ? now < attempt.lockUntil : false;
    const remainingTime = isLockedOut && attempt.lockUntil ? attempt.lockUntil - now : undefined;

    return {
      isLockedOut,
      remainingTime,
      attemptCount: attempt.count
    };
  }

  resetAttempts(request?: RequestLike): void {
    const clientId = this.getClientId(request);
    this.attempts.delete(clientId);
  }

  // Get formatted remaining time for display
  getFormattedRemainingTime(remainingMs: number): string {
    const seconds = Math.ceil(remainingMs / 1000);
    
    if (seconds < 60) {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (remainingSeconds === 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

// Export singleton instance
export const lockoutManager = new LockoutManager();
