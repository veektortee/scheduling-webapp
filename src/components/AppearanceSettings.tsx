'use client';

import { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import ThemeToggle from './ThemeToggle';
import FontSelector from './FontSelector';

export default function AppearanceSettings() {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Settings Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 bg-gradient-to-r from-gray-600 to-gray-700 dark:from-gray-700 dark:to-gray-800 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 dark:hover:from-gray-600 dark:hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-gray-400 to-gray-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
        <div className="relative z-10 flex items-center space-x-2">
          <span className="text-lg">🎨</span>
          <span className="font-semibold text-sm">Appearance</span>
        </div>
      </button>

      {/* Settings Panel */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 z-50 animate-fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">🎨</span>
              </div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Appearance
              </h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors duration-200"
            >
              <span className="text-gray-600 dark:text-gray-300 text-sm">X</span>
            </button>
          </div>

          {/* Theme Toggle Section */}
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">{theme === 'dark' ? '🌙' : '☀️'}</span>
              </div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-200">Theme Mode</h4>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200/50 dark:border-blue-800/50">
              <ThemeToggle />
            </div>
          </div>

          {/* Font Selection */}
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">Aa</span>
              </div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-200">Typography</h4>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200/50 dark:border-green-800/50">
              <FontSelector />
            </div>
          </div>

          {/* Color Preview */}
          <div className="mb-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">🎨</span>
              </div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-200">Color Scheme</h4>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200/50 dark:border-purple-800/50">
              <div className="flex space-x-2">
                <div className="flex-1 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg shadow-inner"></div>
                <div className="flex-1 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-inner"></div>
                <div className="flex-1 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg shadow-inner"></div>
                <div className="flex-1 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg shadow-inner"></div>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">
                Modern gradient color palette
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              ✨ Modern UI for Staff Scheduling
            </p>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
