'use client';

import { useState } from 'react';
import { useScheduling } from '@/context/SchedulingContext';
import { Shift, DEFAULT_SHIFT_TYPES } from '@/types/scheduling';
import { formatTime, formatDate } from '@/lib/scheduling';
import { 
  IoCalendarSharp,
  IoTimeSharp,
  IoStatsChartSharp
} from 'react-icons/io5';
import SchedulingCalendar from '@/components/SchedulingCalendar';

export default function ShiftsTab() {
  const { state, dispatch } = useScheduling();
  const { case: schedulingCase, selectedDate } = state;
  const [selectedShiftIndex, setSelectedShiftIndex] = useState<number | null>(null);
  const [shiftForm, setShiftForm] = useState<Partial<Shift>>({
    id: '',
    type: '',
    start: '',
    end: '',
    date: selectedDate || '',
    allowed_provider_types: [],
  });
  // Default to false to avoid accidentally adding a shift across many days
  const [addToAllDays, setAddToAllDays] = useState(false);

  const shiftsForSelectedDate = selectedDate
    ? schedulingCase.shifts.filter(shift => shift.date === selectedDate)
    : schedulingCase.shifts;

  const handleDateSelect = (date: string) => {
    dispatch({ type: 'SELECT_DATE', payload: date });
    setShiftForm(prev => ({ ...prev, date }));
  };

  const todayIso = new Date().toISOString().split('T')[0];

  const handleShiftSelect = (index: number, shift: Shift) => {
    setSelectedShiftIndex(index);
    setShiftForm({
      ...shift,
      allowed_provider_types: shift.allowed_provider_types || [],
    });
  };

  const handleShiftFormChange = (field: keyof Shift, value: string | string[] | null) => {
    setShiftForm(prev => ({ ...prev, [field]: value }));
  };

  const generateShiftId = (date: string, type: string) => {
    return `${date}_${type}`;
  };

  const addShift = () => {
    if (!shiftForm.type || !shiftForm.start) {
      alert('Please fill in all required fields (type and start time)');
      return;
    }

    // Helper to calculate days remaining in current month from start date
    const getDaysToMonthEnd = (startDate: string) => {
      const start = new Date(startDate);
      const year = start.getFullYear();
      const month = start.getMonth();
      const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
      const startDay = start.getDate();
      return lastDayOfMonth - startDay;
    };

    // Helper to generate all dates in a range
    const generateDateRange = (startDate: string, days: number) => {
      const dates = [];
      const start = new Date(startDate);
      for (let i = 0; i <= days; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + i);
        dates.push(currentDate.toISOString().split('T')[0]);
      }
      return dates;
    };

    const date = shiftForm.date || selectedDate || schedulingCase.calendar.days[0];
    if (!date) {
      alert('Please select a date or generate calendar days first');
      return;
    }

    const daysToMonthEnd = getDaysToMonthEnd(date);
    const dateRange = generateDateRange(date, daysToMonthEnd);

    dateRange.forEach((currentDate) => {
      const newShift: Shift = {
        id: generateShiftId(currentDate, shiftForm.type!),
        date: currentDate,
        type: shiftForm.type!,
        start: `${currentDate}T${shiftForm.start}:00`,
        end: `${currentDate}T${shiftForm.start}:00`, // End time can be adjusted if needed
        allowed_provider_types: shiftForm.allowed_provider_types || [],
      };
      dispatch({ type: 'ADD_SHIFT', payload: newShift });
    });

    // Reset form
    setShiftForm({
      id: '',
      type: '',
      start: '',
      end: '',
      date: selectedDate || '',
      allowed_provider_types: [],
    });
  };

  const updateShift = () => {
    if (selectedShiftIndex === null) return;

    const updatedShift: Shift = {
      id: shiftForm.id!,
      date: shiftForm.date!,
      type: shiftForm.type!,
      start: shiftForm.start!,
      end: shiftForm.end!,
      allowed_provider_types: shiftForm.allowed_provider_types || [],
    };

    dispatch({ 
      type: 'UPDATE_SHIFT', 
      payload: { index: selectedShiftIndex, shift: updatedShift } 
    });
    setSelectedShiftIndex(null);
    setShiftForm({
      id: '',
      type: '',
      start: '',
      end: '',
      date: selectedDate || '',
      allowed_provider_types: [],
    });
  };

  const deleteShift = () => {
    if (selectedShiftIndex === null) return;
    
    dispatch({ type: 'DELETE_SHIFT', payload: selectedShiftIndex });
    setSelectedShiftIndex(null);
    setShiftForm({
      id: '',
      type: '',
      start: '',
      end: '',
      date: selectedDate || '',
      allowed_provider_types: [],
    });
  };

  const applyShiftTemplate = (template: typeof DEFAULT_SHIFT_TYPES[0]) => {
    setShiftForm(prev => ({
      ...prev,
      type: template.id,
      start: template.startTime,
      end: template.endTime,
      allowed_provider_types: template.allowedProviderTypes,
    }));
  };


  return (
    <div className="space-y-4 lg:space-y-8 animate-fade-in-up">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
        {/* Date Selection */}
        <div className="lg:col-span-1">
          <SchedulingCalendar
            availableDays={schedulingCase.calendar.days}
            selectedDays={selectedDate ? [selectedDate] : []}
            onDayToggle={() => {}} // Not used in single mode
            onDaySelect={handleDateSelect}
            mode="single"
            className="h-auto lg:h-120"
            minDate={todayIso}
          />
        </div>

        {/* Shifts List */}
        <div className="lg:col-span-1">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8 hover-glow">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                <IoTimeSharp className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gradient">
                Shifts {selectedDate ? `for ${formatDate(selectedDate)}` : '(All)'}
              </h3>
            </div>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {shiftsForSelectedDate.map((shift, index) => (
                <div
                  key={`${shift.id}-${index}`}
                  onClick={() => handleShiftSelect(index, shift)}
                  className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                    selectedShiftIndex === index
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-300 dark:border-blue-600 shadow-lg scale-105'
                      : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 hover:shadow-md hover:scale-102'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100">{shift.type}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {formatTime(shift.start)} - {formatTime(shift.end)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">ID: {shift.id}</div>
                </div>
              ))}
              {shiftsForSelectedDate.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2 flex justify-center">
                    <IoTimeSharp className="w-10 h-10" />
                  </div>
                  <div className="text-gray-500 text-sm font-medium">
                    No shifts for this date
                  </div>
                  <div className="text-gray-400 text-xs mt-1">
                    Add some shifts below
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Shift Editor */}
        <div className="lg:col-span-1">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8 hover-glow">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <IoStatsChartSharp className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gradient">Shift Editor</h3>
            </div>
            
            {/* Quick Templates */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Quick Templates
              </label>
              <div className="grid grid-cols-2 gap-2">
                {DEFAULT_SHIFT_TYPES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => applyShiftTemplate(template)}
                    className="px-3 py-2 text-xs bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 dark:from-gray-700 dark:to-gray-600 dark:hover:from-gray-600 dark:hover:to-gray-500 text-gray-800 dark:text-gray-200 rounded-lg transition-all duration-200 font-medium hover:scale-105 shadow-sm"
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Shift ID
                </label>
                <input
                  type="text"
                  value={shiftForm.id || ''}
                  onChange={(e) => handleShiftFormChange('id', e.target.value)}
                  placeholder="Auto-generated if empty"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:shadow-md"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Type *
                </label>
                <input
                  type="text"
                  value={shiftForm.type || ''}
                  onChange={(e) => handleShiftFormChange('type', e.target.value)}
                  placeholder="e.g., MD_D, MD_N"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:shadow-md"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Start Time (HH:MM) *
                </label>
                <input
                  type="time"
                  value={shiftForm.start || ''}
                  onChange={(e) => handleShiftFormChange('start', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:shadow-md"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  End Time (HH:MM) *
                </label>
                <input
                  type="time"
                  value={shiftForm.end || ''}
                  onChange={(e) => handleShiftFormChange('end', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:shadow-md"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Allowed Provider Types (comma-separated)
                </label>
                <input
                  type="text"
                  value={(shiftForm.allowed_provider_types || []).join(', ')}
                  onChange={(e) => handleShiftFormChange(
                    'allowed_provider_types',
                    e.target.value.split(',').map(s => s.trim()).filter(s => s)
                  )}
                  placeholder="MD, NP, PA"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:shadow-md"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="add-all-days"
                  checked={addToAllDays}
                  onChange={(e) => setAddToAllDays(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded dark:bg-gray-800 dark:border-gray-600 focus:ring-blue-500"
                />
                <label htmlFor="add-all-days" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Add across ALL calendar days
                </label>
              </div>

              <div className="flex space-x-2 pt-4">
                <button
                  onClick={addShift}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transform hover:scale-[1.02] transition-all duration-200 font-medium shadow-lg"
                >
                  Add
                </button>
                {selectedShiftIndex !== null && (
                  <>
                    <button
                      onClick={updateShift}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transform hover:scale-[1.02] transition-all duration-200 font-medium shadow-lg"
                    >
                      Update
                    </button>
                    <button
                      onClick={deleteShift}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 transform hover:scale-[1.02] transition-all duration-200 font-medium shadow-lg"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>

              {/* Removed test-only button */}
            </div>
          </div>
        </div>
      </div>

      {/* Shift Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl shadow-lg border border-blue-200/50 dark:border-blue-800/50 p-6 hover-glow hover:scale-105 transition-all duration-300">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <IoTimeSharp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Shifts</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{schedulingCase.shifts.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl shadow-lg border border-green-200/50 dark:border-green-800/50 p-6 hover-glow hover:scale-105 transition-all duration-300">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <IoCalendarSharp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Selected Date</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {shiftsForSelectedDate.length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl shadow-lg border border-purple-200/50 dark:border-purple-800/50 p-6 hover-glow hover:scale-105 transition-all duration-300">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <IoTimeSharp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Shift Types</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {new Set(schedulingCase.shifts.map(s => s.type)).size}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl shadow-lg border border-orange-200/50 dark:border-orange-800/50 p-6 hover-glow hover:scale-105 transition-all duration-300">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <IoStatsChartSharp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Selected</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {selectedShiftIndex !== null ? 1 : 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
