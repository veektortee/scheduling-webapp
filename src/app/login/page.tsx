'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

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

      if (result?.error) {
        console.log('❌ SignIn error:', result.error);
        setError('Invalid credentials. Please check your email and password.');
      } else if (result?.ok) {
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center bg-blue-600 rounded-full">
            <span className="text-white text-xl font-bold">🏥</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            Medical Staff Scheduling
          </h2>
          <p className="mt-2 text-center text-sm text-gray-900 dark:text-gray-200">
            Admin access required
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-900 dark:text-gray-100">
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="admin@scheduling.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-900 dark:text-gray-100">
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          <div className="text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Demo Credentials</h4>
              <p className="text-sm text-blue-800">
                <strong>Email:</strong> admin@scheduling.com<br />
                <strong>Password:</strong> admin123
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
