'use client';

import { useState } from 'react';
import { useScheduling } from '@/context/SchedulingContext';
import { generateMonth } from '@/lib/scheduling';
import { WEEKDAY_NAMES } from '@/types/scheduling';

export default function CalendarTab() {
  const { state, dispatch } = useScheduling();
  const { case: schedulingCase } = state;
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(10);

  const handleGenerateDays = () => {
    const days = generateMonth(year, month);
    dispatch({ type: 'GENERATE_DAYS', payload: days });
  };

  const toggleWeekendDay = (dayName: string) => {
    const currentWeekends = schedulingCase.calendar.weekend_days;
    const newWeekends = currentWeekends.includes(dayName)
      ? currentWeekends.filter(d => d !== dayName)
      : [...currentWeekends, dayName];

    dispatch({
      type: 'UPDATE_CASE',
      payload: {
        calendar: {
          ...schedulingCase.calendar,
          weekend_days: newWeekends,
        },
      },
    });
  };

  const removeDays = (indicesToRemove: number[]) => {
    const newDays = schedulingCase.calendar.days.filter((_, index) => 
      !indicesToRemove.includes(index)
    );
    
    dispatch({
      type: 'UPDATE_CASE',
      payload: {
        calendar: {
          ...schedulingCase.calendar,
          days: newDays,
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Month Generator */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Generate Calendar Days</h2>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Year
            </label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value) || 2025)}
              className="w-20 px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Month (1-12)
            </label>
            <input
              type="number"
              min="1"
              max="12"
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value) || 1)}
              className="w-20 px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <button
            onClick={handleGenerateDays}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Generate Days
          </button>
        </div>
      </div>

      {/* Weekend Days Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Weekend Days</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {WEEKDAY_NAMES.map((dayName) => (
            <label key={dayName} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={schedulingCase.calendar.weekend_days.includes(dayName)}
                onChange={() => toggleWeekendDay(dayName)}
                className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded dark:bg-gray-800 dark:border-gray-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{dayName}</span>
            </label>
          ))}
        </div>
        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          Selected weekend days: {schedulingCase.calendar.weekend_days.join(', ') || 'None'}
        </div>
      </div>

      {/* Calendar Days List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Calendar Days ({schedulingCase.calendar.days.length})</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                const selected = document.querySelectorAll('input[name="day-select"]:checked');
                const indices = Array.from(selected).map(input => 
                  parseInt((input as HTMLInputElement).value)
                );
                removeDays(indices);
              }}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Remove Selected
            </button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto border rounded-md">
          {schedulingCase.calendar.days.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No days generated. Use the generator above to create calendar days.
            </div>
          ) : (
            <div className="divide-y">
              {schedulingCase.calendar.days.map((day, index) => {
                const date = new Date(day);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                const isWeekend = schedulingCase.calendar.weekend_days.includes(dayName);
                
                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      isWeekend ? 'bg-blue-50 dark:bg-blue-900' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        name="day-select"
                        value={index}
                        className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded dark:bg-gray-800 dark:border-gray-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">{day}</div>
                        <div className={`text-sm ${isWeekend ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                          {dayName} {isWeekend ? '(Weekend)' : ''}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {/* You can add shift count here later */}
                      Day {index + 1}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {schedulingCase.calendar.days.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Days</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-green-600">
            {schedulingCase.calendar.days.filter(day => {
              const date = new Date(day);
              const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
              return !schedulingCase.calendar.weekend_days.includes(dayName);
            }).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Weekdays</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {schedulingCase.calendar.days.filter(day => {
              const date = new Date(day);
              const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
              return schedulingCase.calendar.weekend_days.includes(dayName);
            }).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Weekend Days</div>
        </div>
      </div>
    </div>
  );
}
