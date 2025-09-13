'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  CalendarDaysIcon,
  XMarkIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday
} from 'date-fns';

export interface ProviderCalendarProps {
  availableDays: string[]; // Days from the scheduling case
  selectedDays: string[]; // Currently selected days for off/on
  onDayToggle: (day: string, selected: boolean) => void;
  onDayClear?: (day: string) => void; // New prop for clearing day preferences
  fixedOffDays?: string[]; // Hard forbidden days
  preferOffDays?: string[]; // Soft forbidden days  
  fixedOnDays?: string[]; // Hard preferred working days (green)
  preferOnDays?: string[]; // Soft preferred working days (blue)
  mode?: 'off' | 'on'; // Whether selecting days off or days on
  disabled?: boolean;
  className?: string;
}

export default function ProviderCalendar({
  availableDays,
  selectedDays,
  onDayToggle,
  onDayClear,
  fixedOffDays = [],
  preferOffDays = [],
  fixedOnDays = [],
  preferOnDays = [],
  mode = 'off',
  disabled = false,
  className = ''
}: ProviderCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Start with Sunday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
  });

  const navigatePrevious = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const navigateNext = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const navigateToToday = () => {
    setCurrentDate(new Date());
  };

  const getDayStatus = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const isAvailable = availableDays.includes(dayStr);
    const isSelected = selectedDays.includes(dayStr);
    const isFixedOff = fixedOffDays.includes(dayStr);
    const isPreferOff = preferOffDays.includes(dayStr);
    const isFixedOn = fixedOnDays.includes(dayStr);
    const isPreferOn = preferOnDays.includes(dayStr);
    
    if (!isAvailable) return 'unavailable';
    if (isFixedOff) return 'fixed-off';
    if (isPreferOff) return 'prefer-off';
    if (isFixedOn) return 'fixed-on';
    if (isPreferOn) return 'prefer-on';
    if (isSelected) return 'pending-selection'; // Neutral pending state instead of mode-specific
    return 'available';
  };

  const getDayClasses = (day: Date) => {
    const status = getDayStatus(day);
    const dayStr = format(day, 'yyyy-MM-dd');
    const isCurrentMonth = isSameMonth(day, currentDate);
    const isHovered = hoveredDay === dayStr;
    const todayClass = isToday(day) ? 'ring-2 ring-blue-400 ring-offset-1 dark:ring-offset-gray-800' : '';
    
    const baseClasses = `
      relative w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold
      transition-all duration-200 ease-in-out cursor-pointer select-none transform
      ${todayClass}
    `;
    
    if (!isCurrentMonth) {
      return `${baseClasses} text-gray-300 dark:text-gray-600 bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed opacity-40`;
    }
    
    switch (status) {
      case 'unavailable':
        return `${baseClasses} text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-50`;
        
      case 'fixed-off':
        return `${baseClasses} text-white bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl hover:scale-110 border-2 border-red-500 ring-2 ring-red-300`;
        
      case 'prefer-off':
        return `${baseClasses} text-orange-900 bg-orange-300 hover:bg-orange-400 shadow-md hover:shadow-lg hover:scale-105 border-2 border-orange-400 dark:text-orange-100 dark:bg-orange-600 dark:hover:bg-orange-700 dark:border-orange-500`;
        
      case 'fixed-on':
        return `${baseClasses} text-white bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl hover:scale-110 border-2 border-green-500 ring-2 ring-green-300`;
        
      case 'prefer-on':
        return `${baseClasses} text-blue-900 bg-blue-300 hover:bg-blue-400 shadow-md hover:shadow-lg hover:scale-105 border-2 border-blue-400 dark:text-blue-100 dark:bg-blue-600 dark:hover:bg-blue-700 dark:border-blue-500`;
        
      case 'pending-selection':
        return `${baseClasses} text-gray-700 dark:text-gray-200 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 shadow-md hover:shadow-lg hover:scale-105 border-2 border-blue-300 dark:border-blue-500 ring-1 ring-blue-200 dark:ring-blue-400 font-semibold`;
        
      default: // available
        return `${baseClasses} text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 shadow-sm hover:shadow-lg hover:scale-105 ${isHovered ? 'ring-2 ring-blue-300 ring-offset-1 scale-105 bg-blue-50 dark:bg-blue-900/30' : ''} transition-all duration-200`;
    }
  };

  const getDayIcon = (day: Date) => {
    const status = getDayStatus(day);
    const dayStr = format(day, 'yyyy-MM-dd');
    
    const handleClearClick = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent day selection
      if (onDayClear && !disabled) {
        onDayClear(dayStr);
      }
    };
    
    switch (status) {
      case 'fixed-off':
        return (
          <button
            onClick={handleClearClick}
            className="w-3 h-3 sm:w-4 sm:h-4 absolute -top-0.5 -right-0.5 bg-red-800 hover:bg-red-900 text-white rounded-full p-0.5 transition-colors cursor-pointer"
            title="Remove Fixed OFF"
          >
            <XMarkIcon className="w-full h-full" />
          </button>
        );
      case 'prefer-off':
        return (
          <button
            onClick={handleClearClick}
            className="w-3 h-3 sm:w-4 sm:h-4 absolute -top-0.5 -right-0.5 bg-orange-600 hover:bg-orange-700 text-white rounded-full p-0.5 transition-colors cursor-pointer"
            title="Remove Prefer OFF"
          >
            <XMarkIcon className="w-full h-full" />
          </button>
        );
      case 'fixed-on':
        return (
          <button
            onClick={handleClearClick}
            className="w-3 h-3 sm:w-4 sm:h-4 absolute -top-0.5 -right-0.5 bg-green-800 hover:bg-green-900 text-white rounded-full p-0.5 transition-colors cursor-pointer"
            title="Remove Fixed ON"
          >
            <XMarkIcon className="w-full h-full" />
          </button>
        );
      case 'prefer-on':
        return (
          <button
            onClick={handleClearClick}
            className="w-3 h-3 sm:w-4 sm:h-4 absolute -top-0.5 -right-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-0.5 transition-colors cursor-pointer"
            title="Remove Prefer ON"
          >
            <XMarkIcon className="w-full h-full" />
          </button>
        );
      case 'pending-selection':
        return <div className="w-3 h-3 absolute top-0.5 right-0.5 bg-blue-300 dark:bg-blue-500 rounded-full shadow-sm border border-blue-400 dark:border-blue-300" />;
      default:
        return null;
    }
  };

  const handleDayClick = (day: Date) => {
    if (disabled) return;
    
    const dayStr = format(day, 'yyyy-MM-dd');
    const isCurrentMonth = isSameMonth(day, currentDate);
    const isAvailable = availableDays.includes(dayStr);
    const isFixedOff = fixedOffDays.includes(dayStr);
    
    // Don't allow interaction with unavailable days or fixed off days
    if (!isCurrentMonth || !isAvailable || isFixedOff) return;
    
    const isCurrentlySelected = selectedDays.includes(dayStr);
    
    // Add immediate visual feedback with a brief flash
    setHoveredDay(dayStr);
    setTimeout(() => setHoveredDay(null), 150);
    
    onDayToggle(dayStr, !isCurrentlySelected);
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const selectedCount = selectedDays.length;
  const availableCount = availableDays.length;

  return (
    <div className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-3 sm:p-4 flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${mode === 'off' ? 'bg-gradient-to-br from-red-500 to-pink-500' : 'bg-gradient-to-br from-blue-500 to-indigo-500'}`}>
            <CalendarDaysIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
          </div>
            <div>
            <h3 className={`text-sm sm:text-base font-bold ${mode === 'off' ? 'text-red-700 dark:text-red-300' : 'text-blue-700 dark:text-blue-300'}`}>
              Days {mode === 'off' ? 'OFF' : 'ON'} 
              <span className={`ml-2 text-xs px-2 py-1 rounded-full inline-flex items-center justify-center ${mode === 'off' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                <span className={mode === 'off' ? 'inline-block w-2 h-2 rounded-full bg-red-500' : 'inline-block w-2 h-2 rounded-full bg-blue-500'} aria-hidden="true" />
                <span className="sr-only">{mode === 'off' ? 'Off' : 'On'}</span>
              </span>
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {selectedCount} / {availableCount} selected
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-center sm:justify-end space-x-1">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={navigatePrevious}
            className="p-1.5 sm:p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={navigateToToday}
            className="px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium transition-colors text-xs sm:text-sm"
          >
            {format(currentDate, 'MMM yyyy')}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={navigateNext}
            className="p-1.5 sm:p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
          >
            <ChevronRightIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </motion.button>
        </div>
      </div>

      {/* Instructions and Compact Legend */}
      <div className="mb-3 space-y-2 flex-shrink-0">
        <div className={`p-2 rounded-lg text-center ${mode === 'off' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'}`}>
          <p className="text-xs font-medium">
            Click on dates to select them, then use buttons to apply {mode === 'off' ? 'OFF' : 'ON'} preferences
          </p>
        </div>
        <div className="grid grid-cols-3 gap-1 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-red-600 rounded border border-red-500"></div>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Fixed OFF</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-orange-400 rounded border border-orange-400"></div>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Prefer OFF</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-gray-300 dark:bg-gray-500 rounded border border-gray-400 ring-1 ring-gray-300 dark:ring-gray-400"></div>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Selected</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-600 rounded border border-green-500"></div>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Fixed ON</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-blue-400 rounded border border-blue-400"></div>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Prefer ON</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"></div>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Available</span>
        </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-2 overflow-auto flex-1">
        {/* Week headers */}
        <div className="grid grid-cols-7 gap-1 sticky top-0 bg-white/90 dark:bg-gray-800/90 z-10">
          {weekDays.map((day) => (
            <div
              key={day}
              className="h-6 sm:h-8 flex items-center justify-center text-xs font-semibold text-gray-500 dark:text-gray-400"
            >
              {day.slice(0, 2)}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          <AnimatePresence>
            {calendarDays.map((day, index) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              return (
                <motion.div
                  key={dayStr}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.005 }}
                  className={getDayClasses(day)}
                  onClick={() => handleDayClick(day)}
                  onMouseEnter={() => setHoveredDay(dayStr)}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  <span className="relative z-10 font-bold">
                    {format(day, 'd')}
                  </span>
                  {getDayIcon(day)}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Selection Summary */}
      {selectedCount > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ExclamationCircleIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-blue-800 dark:text-blue-200">
                {selectedCount} {selectedCount === 1 ? 'day' : 'days'} selected
              </span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => selectedDays.forEach(day => onDayToggle(day, false))}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-800/50"
            >
              Clear
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
}