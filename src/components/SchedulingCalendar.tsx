'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
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
  isToday,
  isSameDay,
  parseISO
} from 'date-fns';

export interface SchedulingCalendarProps {
  availableDays: string[]; // Days from the scheduling case
  selectedDays: string[]; // Currently selected days
  onDayToggle: (day: string, selected: boolean) => void;
  onDaySelect?: (day: string) => void; // For single selection mode
  mode?: 'single' | 'multiple'; // Selection mode
  disabled?: boolean;
  className?: string;
  initialDate?: Date; // Starting month/year to display
  minDate?: string; // Minimum selectable date (YYYY-MM-DD format)
}

export default function SchedulingCalendar({
  availableDays,
  selectedDays,
  onDayToggle,
  onDaySelect,
  mode = 'multiple',
  disabled = false,
  className = '',
  initialDate,
  minDate
}: SchedulingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(initialDate || new Date());

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
    const isBeforeMinDate = minDate ? dayStr < minDate : false;

    if (!isAvailable || isBeforeMinDate) return 'unavailable';
    if (isSelected) return 'selected';
    return 'available';
  };

  const getDayClasses = (day: Date) => {
    const status = getDayStatus(day);
    const isCurrentMonth = isSameMonth(day, currentDate);
    const isTodayDate = isToday(day);

    const baseClasses = `
      relative w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold
      transition-all duration-200 ease-in-out cursor-pointer select-none transform
      ${isTodayDate ? 'ring-2 ring-blue-400 ring-offset-1' : ''}
    `;

    if (!isCurrentMonth) {
      return `${baseClasses} text-gray-300 dark:text-gray-600 bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed opacity-40`;
    }

    switch (status) {
      case 'unavailable':
        return `${baseClasses} text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-50`;

      case 'selected':
        return `${baseClasses} text-white bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl hover:scale-110 border-2 border-blue-500 ring-2 ring-blue-300`;

      default: // available
        return `${baseClasses} text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 shadow-sm hover:shadow-lg hover:scale-105`;
    }
  };

  const handleDayClick = (day: Date) => {
    if (disabled) return;

    const dayStr = format(day, 'yyyy-MM-dd');
    const isCurrentMonth = isSameMonth(day, currentDate);
    const isAvailable = availableDays.includes(dayStr);
    const isBeforeMinDate = minDate ? dayStr < minDate : false;

    if (!isCurrentMonth || !isAvailable || isBeforeMinDate) return;

    if (mode === 'single' && onDaySelect) {
      onDaySelect(dayStr);
    } else {
      const isCurrentlySelected = selectedDays.includes(dayStr);
      onDayToggle(dayStr, !isCurrentlySelected);
    }
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const selectedCount = selectedDays.length;
  const availableCount = availableDays.length;

  return (
    <div className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-3 sm:p-4 flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${mode === 'single' ? 'bg-gradient-to-br from-green-500 to-blue-500' : 'bg-gradient-to-br from-blue-500 to-purple-500'}`}>
            <CalendarDaysIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
          </div>
          <div>
            <h3 className={`text-sm sm:text-base font-bold ${mode === 'single' ? 'text-green-700 dark:text-green-300' : 'text-blue-700 dark:text-blue-300'}`}>
              {mode === 'single' ? 'Select Date' : 'Select Dates'}
              {mode === 'multiple' && selectedCount > 0 && ` (${selectedCount})`}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {availableCount} available days
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

      {/* Instructions */}
      <div className="mb-3">
        <div className={`p-2 rounded-lg text-center ${mode === 'single' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'}`}>
          <p className="text-xs font-medium">
            {mode === 'single'
              ? 'Click on a date to select it'
              : 'Click on dates to select/deselect them'
            }
          </p>
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
                >
                  <span className="relative z-10 font-bold">
                    {format(day, 'd')}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Selection Summary for multiple mode */}
      {mode === 'multiple' && selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
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
              Clear All
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
}