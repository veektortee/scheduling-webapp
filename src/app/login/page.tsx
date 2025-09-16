'use client';

import { useState, useEffect } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { HiShieldCheck, HiEye, HiEyeSlash } from 'react-icons/hi2';


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  // Credential recovery via email removed; no client-side state required
  const [hasFailedAttempt, setHasFailedAttempt] = useState(false);
  const [lockoutInfo, setLockoutInfo] = useState<{
    isLockedOut: boolean;
    remainingTime?: number;
    attemptCount: number;
    formattedTime?: string;
  }>({ isLockedOut: false, attemptCount: 0 });

  // Check lockout status
  const checkLockoutStatus = async () => {
    try {
      const response = await fetch('/api/auth/lockout-status');
      if (response.ok) {
        const data = await response.json();
        setLockoutInfo(data);
        
        if (data.isLockedOut && data.formattedTime) {
          setError(`Too many failed attempts. Please wait ${data.formattedTime} before trying again.`);
        }
      }
    } catch (error) {
      console.error('Error checking lockout status:', error);
    }
  };

  // Credential recovery removed - no handlers required

  // Check lockout status periodically if locked out
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (lockoutInfo.isLockedOut && lockoutInfo.remainingTime) {
      interval = setInterval(() => {
        checkLockoutStatus();
      }, 1000); // Check every second
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [lockoutInfo.isLockedOut, lockoutInfo.remainingTime]);

  // Check if user is already authenticated immediately
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const session = await getSession();
  console.log('[INFO] Auto-check session status:', session);
        
        if (session) {
          console.log('[OK] User already authenticated, redirecting to home...');
          window.location.href = '/';
        } else {
          console.log('[USER] User not authenticated, staying on login page');
          // Check lockout status when page loads
          await checkLockoutStatus();
        }
      } catch (error) {
  console.log('[ERROR] Error checking authentication:', error);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuthentication();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check lockout status before attempting login
    await checkLockoutStatus();
    if (lockoutInfo.isLockedOut) {
      return; // Error message already set by checkLockoutStatus
    }
    
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

  console.log('[INFO] SignIn result:', result);

      if (result?.error) {
  console.log('[ERROR] SignIn error:', result.error);
        
        // Check if it's a lockout error
        if (result.error.includes('wait')) {
          setError(result.error);
          // Refresh lockout status
          await checkLockoutStatus();
        } else {
          setError('Invalid credentials. Please check your username and password.');
          // Mark that user has failed an attempt and check recovery availability
          setHasFailedAttempt(true);
          console.log('[INFO] Setting hasFailedAttempt to true after login failure');
          // Check updated lockout status after failed attempt
          setTimeout(checkLockoutStatus, 100);
        }
      } else if (result?.ok) {
  console.log('[SUCCESS] SignIn successful, waiting for session...');
        
        // Wait a bit for session to be established
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check session multiple times if needed
        let session = null;
        let attempts = 0;
        const maxAttempts = 5;
        
        while (!session && attempts < maxAttempts) {
          session = await getSession();
          if (!session) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
        
  console.log('[INFO] Final session check:', session);
        
        if (session) {
          console.log('[OK] Session confirmed, redirecting...');
          // Use window.location for a full page redirect to ensure middleware runs
          window.location.href = '/';
        } else {
          console.log('[ERROR] No session found after multiple attempts');
          setError('Authentication succeeded but session not established. Please try again.');
        }
      } else {
  console.log('[ERROR] Unexpected signIn result:', result);
        setError('Unexpected authentication result. Please try again.');
      }
    } catch (error) {
  console.log('[ERROR] SignIn exception:', error);
      setError('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-slate-50/50 to-blue-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-slate-800 py-6 lg:py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/10 via-transparent to-teal-50/10 dark:from-blue-900/5 dark:via-transparent dark:to-teal-900/5"></div>
      
      {checkingAuth && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Checking Authentication
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Verifying if you&apos;re already signed in...
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="relative max-w-md w-full space-y-6 lg:space-y-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 lg:p-8">
        <div>
          <div className="mx-auto h-12 w-12 lg:h-14 lg:w-14 flex items-center justify-center bg-gradient-to-br from-blue-600 to-teal-600 rounded-xl shadow-lg">
            <HiShieldCheck className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
          </div>
          <div className="mt-6 lg:mt-8 text-center">
            <div>
              <h2 className="text-2xl lg:text-4xl font-extrabold tracking-tight text-gradient break-words">
                Staff Scheduling System
              </h2>
            </div>
            <div className="mt-3 flex items-center justify-center space-x-2">
              <div className="h-1 w-20 lg:w-24 bg-gradient-to-r from-slate-400 via-blue-500 to-teal-500 rounded-full shadow-sm"></div>
              <div className="h-2 w-2 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="mt-4 text-center text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-300">
            Admin access required
          </p>
        </div>
        
        <form className="mt-6 lg:mt-8 space-y-4 lg:space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 lg:px-6 py-3 lg:py-4 rounded-xl shadow-lg backdrop-blur-sm animate-fade-in-up">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-sm lg:text-base break-words">{error}</span>
              </div>
            </div>
          )}
          
          {lockoutInfo.attemptCount > 0 && lockoutInfo.attemptCount < 3 && !lockoutInfo.isLockedOut && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300 px-4 lg:px-6 py-2 lg:py-3 rounded-xl shadow-lg backdrop-blur-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-xs lg:text-sm">
                  Warning: {lockoutInfo.attemptCount} of 3 failed attempts. 
                  {3 - lockoutInfo.attemptCount} attempt{3 - lockoutInfo.attemptCount !== 1 ? 's' : ''} remaining.
                </span>
              </div>
            </div>
          )}
          
          <div className="space-y-4 lg:space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs lg:text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Username
              </label>
              <input
                id="email"
                name="email"
                type="text"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:shadow-md text-sm lg:text-base selection:bg-blue-200 selection:text-blue-900 dark:selection:bg-blue-700 dark:selection:text-white"
                placeholder="Enter your username"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-xs lg:text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    // Reset recovery state when user starts typing (gives fresh start)
                    if (hasFailedAttempt && e.target.value !== password) {
                      setError('');
                      setHasFailedAttempt(false);
                    }
                  }}
                  className="w-full px-3 lg:px-4 py-2 lg:py-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:shadow-md text-sm lg:text-base selection:bg-blue-200 selection:text-blue-900 dark:selection:bg-blue-700 dark:selection:text-white"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  {showPassword ? <HiEyeSlash className="w-4 h-4 lg:w-5 lg:h-5" /> : <HiEye className="w-4 h-4 lg:w-5 lg:h-5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || lockoutInfo.isLockedOut}
              className={`group relative w-full flex justify-center py-3 lg:py-4 px-4 lg:px-6 border border-transparent text-sm lg:text-base font-semibold rounded-xl text-white transition-all duration-300 shadow-lg hover:shadow-2xl ${
                loading || lockoutInfo.isLockedOut
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:scale-105'
              }`}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Signing in...
                </div>
              ) : lockoutInfo.isLockedOut ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 rounded-full bg-red-500 animate-pulse"></div>
                  <span>Locked - Wait {lockoutInfo.formattedTime}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <HiShieldCheck className="w-5 h-5" />
                  <span>Sign in</span>
                </div>
              )}
            </button>
          </div>
        </form>

        {/* Credential recovery UI removed */}
      </div>
    </div>
  );
}
