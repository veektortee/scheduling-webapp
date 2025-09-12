'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  CalendarDaysIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  MinusCircleIcon
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
  fixedOffDays?: string[]; // Hard forbidden days
  preferOffDays?: string[]; // Soft forbidden days  
  preferOnDays?: string[]; // Preferred working days
  mode?: 'off' | 'on'; // Whether selecting days off or days on
  disabled?: boolean;
  className?: string;
}

export default function ProviderCalendar({
  availableDays,
  selectedDays,
  onDayToggle,
  fixedOffDays = [],
  preferOffDays = [],
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
    const isPreferOn = preferOnDays.includes(dayStr);
    
    if (!isAvailable) return 'unavailable';
    if (isFixedOff) return 'fixed-off';
    if (isPreferOff) return 'prefer-off';
    if (isPreferOn) return 'prefer-on';
    if (isSelected) return mode === 'off' ? 'selected-off' : 'selected-on';
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
        
      case 'prefer-on':
        return `${baseClasses} text-green-900 bg-green-300 hover:bg-green-400 shadow-md hover:shadow-lg hover:scale-105 border-2 border-green-400 dark:text-green-100 dark:bg-green-600 dark:hover:bg-green-700 dark:border-green-500`;
        
      case 'selected-off':
        return `${baseClasses} text-white bg-red-500 hover:bg-red-600 shadow-lg hover:shadow-xl hover:scale-110 border-2 border-red-400 ring-2 ring-red-300 ring-offset-2 transform scale-110`;
        
      case 'selected-on':
        return `${baseClasses} text-white bg-blue-500 hover:bg-blue-600 shadow-lg hover:shadow-xl hover:scale-110 border-2 border-blue-400 ring-2 ring-blue-300 ring-offset-2 transform scale-110`;
        
      default: // available
        return `${baseClasses} text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 shadow-sm hover:shadow-md hover:scale-105 ${isHovered ? 'ring-2 ring-blue-300 ring-offset-1 scale-105' : ''}`;
    }
  };

  const getDayIcon = (day: Date) => {
    const status = getDayStatus(day);
    
    switch (status) {
      case 'fixed-off':
        return <XMarkIcon className="w-3 h-3 sm:w-4 sm:h-4 absolute -top-0.5 -right-0.5 bg-red-800 text-white rounded-full p-0.5" />;
      case 'prefer-off':
        return <MinusCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 absolute -top-0.5 -right-0.5 bg-orange-600 text-white rounded-full p-0.5" />;
      case 'prefer-on':
        return <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 absolute -top-0.5 -right-0.5 bg-green-600 text-white rounded-full p-0.5" />;
      case 'selected-off':
        return <div className="w-2 h-2 absolute top-0.5 right-0.5 bg-white rounded-full shadow-sm animate-pulse" />;
      case 'selected-on':
        return <div className="w-2 h-2 absolute top-0.5 right-0.5 bg-white rounded-full shadow-sm animate-pulse" />;
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
    onDayToggle(dayStr, !isCurrentlySelected);
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const selectedCount = selectedDays.length;
  const availableCount = availableDays.length;

  return (
    <div className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-3 sm:p-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <CalendarDaysIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
              Days {mode === 'off' ? 'OFF' : 'ON'}
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

      {/* Compact Legend */}
      <div className="grid grid-cols-2 gap-2 mb-4 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="flex items-center space-x-1.5">
          <div className="w-3 h-3 bg-red-600 rounded border border-red-500"></div>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Fixed OFF</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-3 h-3 bg-orange-400 rounded border border-orange-400"></div>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Prefer OFF</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-3 h-3 bg-green-400 rounded border border-green-400"></div>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Prefer ON</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className={`w-3 h-3 rounded border-2 ring-2 ${mode === 'off' ? 'bg-red-500 border-red-400 ring-red-300' : 'bg-blue-500 border-blue-400 ring-blue-300'}`}></div>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Selected</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-2">
        {/* Week headers */}
        <div className="grid grid-cols-7 gap-1">
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