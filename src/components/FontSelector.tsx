'use client';

import { useState } from 'react';

const FONT_OPTIONS = [
  { name: 'Geist Sans', value: 'geist-sans', description: 'Modern & Clean' },
  { name: 'Inter', value: 'inter', description: 'Professional' },
  { name: 'Roboto', value: 'roboto', description: 'Friendly' },
  { name: 'Open Sans', value: 'open-sans', description: 'Versatile' },
];

export default function FontSelector() {
  const [selectedFont, setSelectedFont] = useState('geist-sans');

  const handleFontChange = (fontValue: string) => {
    setSelectedFont(fontValue);
    // Here you would typically update a global font context or localStorage
    // For now, we'll just update the component state
  };

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Select Font Family
      </div>
      
      <div className="space-y-2">
        {FONT_OPTIONS.map((font) => (
          <label
            key={font.value}
            className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
              selectedFont === font.value
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <input
                type="radio"
                name="font"
                value={font.value}
                checked={selectedFont === font.value}
                onChange={() => handleFontChange(font.value)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div>
                <div className={`font-semibold text-gray-800 dark:text-gray-200 ${
                  font.value === 'geist-sans' ? 'font-sans' : 
                  font.value === 'inter' ? 'font-sans' :
                  font.value === 'roboto' ? 'font-sans' : 'font-sans'
                }`}>
                  {font.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {font.description}
                </div>
              </div>
            </div>
            {selectedFont === font.value && (
              <div className="text-blue-500 text-sm">✓</div>
            )}
          </label>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Preview:</div>
        <div className={`text-lg font-semibold text-gray-800 dark:text-gray-200 ${
          selectedFont === 'geist-sans' ? 'font-sans' : 
          selectedFont === 'inter' ? 'font-sans' :
          selectedFont === 'roboto' ? 'font-sans' : 'font-sans'
        }`}>
          Staff Scheduling System
        </div>
        <div className={`text-sm text-gray-600 dark:text-gray-400 mt-1 ${
          selectedFont === 'geist-sans' ? 'font-sans' : 
          selectedFont === 'inter' ? 'font-sans' :
          selectedFont === 'roboto' ? 'font-sans' : 'font-sans'
        }`}>
          Advanced scheduling and optimization for staff
        </div>
      </div>
    </div>
  );
}
