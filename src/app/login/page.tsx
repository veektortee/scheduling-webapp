'use client';

import { useState, useEffect } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { HiShieldCheck } from 'react-icons/hi2';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if user is already authenticated immediately
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const session = await getSession();
        console.log('🔍 Auto-check session status:', session);
        
        if (session) {
          console.log('✅ User already authenticated, redirecting to home...');
          window.location.href = '/';
        } else {
          console.log('👤 User not authenticated, staying on login page');
        }
      } catch (error) {
        console.log('❌ Error checking authentication:', error);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuthentication();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      console.log('🔍 SignIn result:', result);

      if (result?.error) {
        console.log('❌ SignIn error:', result.error);
        setError('Invalid credentials. Please check your username and password.');
      } else if (result?.ok) {
        console.log('✅ SignIn successful, waiting for session...');
        
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
        
        console.log('🔍 Final session check:', session);
        
        if (session) {
          console.log('✅ Session confirmed, redirecting...');
          // Use window.location for a full page redirect to ensure middleware runs
          window.location.href = '/';
        } else {
          console.log('❌ No session found after multiple attempts');
          setError('Authentication succeeded but session not established. Please try again.');
        }
      } else {
        console.log('❌ Unexpected signIn result:', result);
        setError('Unexpected authentication result. Please try again.');
      }
    } catch (error) {
      console.log('❌ SignIn exception:', error);
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
                Medical Staff Scheduling System
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
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:shadow-md text-sm lg:text-base selection:bg-blue-200 selection:text-blue-900 dark:selection:bg-blue-700 dark:selection:text-white"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-3 lg:py-4 px-4 lg:px-6 border border-transparent text-sm lg:text-base font-semibold rounded-xl text-white transition-all duration-300 shadow-lg hover:shadow-2xl ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:scale-105'
              }`}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Signing in...
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
      </div>
    </div>
  );
}
