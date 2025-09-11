export default function SettingsSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50/50 to-blue-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-slate-800 py-6 px-4">
      <div className="max-w-2xl mx-auto animate-pulse">
        {/* Header Skeleton */}
        <div className="mb-8">
          {/* Back button skeleton */}
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="w-32 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
          
          {/* Title section skeleton */}
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-gray-300 dark:bg-gray-600 rounded-xl"></div>
            <div>
              <div className="w-48 h-8 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
              <div className="w-36 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
          </div>
        </div>

        {/* Main Form Skeleton */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8">
          
          {/* Current Username Info Skeleton */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
            <div className="w-40 h-5 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
            <div className="w-56 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>

          {/* Form Fields Skeleton */}
          <div className="space-y-6">
            {/* Current Password Field */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="w-32 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
              <div className="relative">
                <div className="w-full h-12 bg-gray-300 dark:bg-gray-600 rounded-xl"></div>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="w-5 h-5 bg-gray-400 dark:bg-gray-500 rounded"></div>
                </div>
              </div>
            </div>

            {/* New Username Field */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="w-28 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
              <div className="w-full h-12 bg-gray-300 dark:bg-gray-600 rounded-xl"></div>
            </div>

            {/* New Password Field */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="w-28 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
              <div className="relative">
                <div className="w-full h-12 bg-gray-300 dark:bg-gray-600 rounded-xl"></div>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="w-5 h-5 bg-gray-400 dark:bg-gray-500 rounded"></div>
                </div>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="w-40 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
              <div className="relative">
                <div className="w-full h-12 bg-gray-300 dark:bg-gray-600 rounded-xl"></div>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="w-5 h-5 bg-gray-400 dark:bg-gray-500 rounded"></div>
                </div>
              </div>
            </div>

            {/* Backup Email Field */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="w-36 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
              <div className="w-full h-12 bg-gray-300 dark:bg-gray-600 rounded-xl"></div>
              <div className="mt-1 w-72 h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
          </div>

          {/* Submit Button Skeleton */}
          <div className="pt-4 mt-6">
            <div className="w-full h-14 bg-gray-300 dark:bg-gray-600 rounded-xl"></div>
          </div>

          {/* Security Notice Skeleton */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <div className="w-48 h-5 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
            <div className="space-y-1">
              <div className="w-full h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div className="w-5/6 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div className="w-3/4 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div className="w-4/5 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div className="w-2/3 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}