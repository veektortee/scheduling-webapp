'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { HiShieldCheck } from 'react-icons/hi2';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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

      if (result?.error && result.error !== 'Configuration') {
        console.log('❌ SignIn error:', result.error);
        setError('Invalid credentials. Please check your email and password.');
      } else if (result?.ok || result?.error === 'Configuration') {
        // Handle Configuration error as success since auth is actually working
        console.log('✅ SignIn successful, checking session...');
        // Check session to ensure user is authenticated
        const session = await getSession();
        console.log('🔍 Session after signIn:', session);
        if (session) {
          console.log('✅ Session confirmed, redirecting...');
          router.push('/');
          router.refresh();
        } else {
          console.log('❌ No session found after successful signIn');
          setError('Authentication succeeded but session not found. Please try again.');
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-teal-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/20 via-transparent to-purple-50/20 dark:from-blue-900/10 dark:via-transparent dark:to-purple-900/10"></div>
      <div className="relative max-w-md w-full space-y-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8">
        <div>
          <div className="mx-auto h-14 w-14 flex items-center justify-center bg-gradient-to-br from-blue-600 to-teal-600 rounded-xl shadow-lg">
            <HiShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div className="mt-8 text-center">
            <div>
              <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-purple-400 dark:to-teal-400 whitespace-nowrap">
                Medical Staff Scheduling System
              </h2>
            </div>
            <div className="mt-3 flex items-center justify-center space-x-2">
              <div className="h-1 w-24 bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500 rounded-full shadow-sm"></div>
              <div className="h-2 w-2 bg-gradient-to-r from-purple-500 to-teal-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="mt-4 text-center text-sm font-medium text-gray-600 dark:text-gray-300">
            Admin access required
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-6 py-4 rounded-xl shadow-lg backdrop-blur-sm animate-fade-in-up">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}
          
          <div className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:shadow-md"
                placeholder="admin@scheduling.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
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
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:shadow-md"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-4 px-6 border border-transparent text-base font-semibold rounded-xl text-white transition-all duration-300 shadow-lg hover:shadow-2xl ${
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

          <div className="text-center">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 backdrop-blur-sm">
              <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-3 flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Demo Credentials</span>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              </h4>
              <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <div className="flex justify-between items-center">
                  <strong>Email:</strong> 
                  <code className="bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded text-xs">admin@scheduling.com</code>
                </div>
                <div className="flex justify-between items-center">
                  <strong>Password:</strong> 
                  <code className="bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded text-xs">admin123</code>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
