'use client';

import { useState } from 'react';
import { useScheduling } from '@/context/SchedulingContext';
import { generateMonth } from '@/lib/scheduling';
import { WEEKDAY_NAMES } from '@/types/scheduling';
import { 
  IoCalendarSharp,
  IoSunnySharp,
  IoStatsChartSharp,
  IoTrashSharp,
  IoRocketSharp
} from 'react-icons/io5';

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
    <div className="space-y-8 animate-fade-in-up">
      {/* Month Generator */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8 hover-glow">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <IoCalendarSharp className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Generate Calendar Days
          </h2>
        </div>
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Year
            </label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value) || 2025)}
              className="w-24 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:shadow-md font-semibold text-center"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Month (1-12)
            </label>
            <input
              type="number"
              min="1"
              max="12"
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value) || 1)}
              className="w-24 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:shadow-md font-semibold text-center"
            />
          </div>
          
          <button
            onClick={handleGenerateDays}
            className="relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-semibold flex items-center space-x-2 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            <IoRocketSharp className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Generate Days</span>
          </button>
        </div>
      </div>

      {/* Weekend Days Selection */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8 hover-glow">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <IoSunnySharp className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Weekend Days Configuration
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {WEEKDAY_NAMES.map((dayName) => {
            const isWeekend = schedulingCase.calendar.weekend_days.includes(dayName);
            return (
              <label key={dayName} className={`relative flex items-center space-x-3 cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                isWeekend 
                  ? 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border-purple-300 dark:border-purple-700 shadow-lg' 
                  : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600'
              }`}>
                <input
                  type="checkbox"
                  checked={isWeekend}
                  onChange={() => toggleWeekendDay(dayName)}
                  className="w-5 h-5 text-purple-600 bg-white border-gray-300 rounded focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className={`font-semibold transition-colors duration-300 ${
                  isWeekend 
                    ? 'text-purple-700 dark:text-purple-300' 
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {dayName}
                </span>
                {isWeekend && (
                  <IoSunnySharp className="w-4 h-4 text-purple-500" />
                )}
              </label>
            );
          })}
        </div>
        <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200/50 dark:border-purple-800/50">
          <div className="flex items-center space-x-2">
            <span className="text-purple-600 dark:text-purple-400 font-semibold text-sm">Selected weekend days:</span>
            <span className="text-purple-700 dark:text-purple-300 font-bold">
              {schedulingCase.calendar.weekend_days.join(', ') || 'None'}
            </span>
          </div>
        </div>
      </div>

      {/* Calendar Days List */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8 hover-glow">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
              <IoStatsChartSharp className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Calendar Days ({schedulingCase.calendar.days.length})
            </h2>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                const selected = document.querySelectorAll('input[name="day-select"]:checked');
                const indices = Array.from(selected).map(input => 
                  parseInt((input as HTMLInputElement).value)
                );
                removeDays(indices);
              }}
              className="relative px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 font-semibold flex items-center space-x-2 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 border border-red-500/20 overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-rose-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <IoTrashSharp className="w-4 h-4" />
              <span className="relative z-10">Remove Selected</span>
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

      {/* Calendar Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl shadow-lg border border-blue-200/50 dark:border-blue-800/50 p-6 hover-glow hover:scale-105 transition-all duration-300">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <IoCalendarSharp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Calendar Days</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{schedulingCase.calendar.days.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl shadow-lg border border-purple-200/50 dark:border-purple-800/50 p-6 hover-glow hover:scale-105 transition-all duration-300">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <IoSunnySharp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Weekend Days</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{schedulingCase.calendar.weekend_days.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl shadow-lg border border-green-200/50 dark:border-green-800/50 p-6 hover-glow hover:scale-105 transition-all duration-300">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <IoCalendarSharp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Current Month</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{month}/{year}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
