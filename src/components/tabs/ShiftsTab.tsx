'use client';

import { useState } from 'react';
import { useScheduling } from '@/context/SchedulingContext';
import { Shift, DEFAULT_SHIFT_TYPES } from '@/types/scheduling';
import { formatTime, formatDate } from '@/lib/scheduling';

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
  const [addToAllDays, setAddToAllDays] = useState(true);

  const shiftsForSelectedDate = selectedDate
    ? schedulingCase.shifts.filter(shift => shift.date === selectedDate)
    : schedulingCase.shifts;

  const handleDateSelect = (date: string) => {
    dispatch({ type: 'SELECT_DATE', payload: date });
    setShiftForm(prev => ({ ...prev, date }));
  };

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
    if (!shiftForm.type || !shiftForm.start || !shiftForm.end) {
      alert('Please fill in all required fields (type, start time, end time)');
      return;
    }

    if (addToAllDays) {
      // Add shift to all calendar days
      schedulingCase.calendar.days.forEach(date => {
        const newShift: Shift = {
          id: generateShiftId(date, shiftForm.type!),
          date,
          type: shiftForm.type!,
          start: `${date}T${shiftForm.start}:00`,
          end: shiftForm.end!.includes('T') ? shiftForm.end! : 
               (shiftForm.start! > shiftForm.end! ? 
                getNextDay(date) + `T${shiftForm.end}:00` : 
                `${date}T${shiftForm.end}:00`),
          allowed_provider_types: shiftForm.allowed_provider_types || [],
        };
        dispatch({ type: 'ADD_SHIFT', payload: newShift });
      });
    } else {
      // Add shift to selected date only
      const date = shiftForm.date || selectedDate || schedulingCase.calendar.days[0];
      if (!date) {
        alert('Please select a date or generate calendar days first');
        return;
      }

      const newShift: Shift = {
        id: shiftForm.id || generateShiftId(date, shiftForm.type!),
        date,
        type: shiftForm.type!,
        start: `${date}T${shiftForm.start}:00`,
        end: shiftForm.end!.includes('T') ? shiftForm.end! : 
             (shiftForm.start! > shiftForm.end! ? 
              getNextDay(date) + `T${shiftForm.end}:00` : 
              `${date}T${shiftForm.end}:00`),
        allowed_provider_types: shiftForm.allowed_provider_types || [],
      };
      dispatch({ type: 'ADD_SHIFT', payload: newShift });
    }

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

  const getNextDay = (dateStr: string) => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Date Selection */}
      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Select Date</h3>
          <div className="max-h-96 overflow-y-auto space-y-1">
            {schedulingCase.calendar.days.map((date) => (
              <button
                key={date}
                onClick={() => handleDateSelect(date)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                  selectedDate === date
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-medium'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {formatDate(date)}
              </button>
            ))}
            {schedulingCase.calendar.days.length === 0 && (
              <div className="text-gray-500 text-sm">
                No calendar days. Generate them in the Calendar tab.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shifts List */}
      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Shifts {selectedDate ? `for ${formatDate(selectedDate)}` : '(All)'}
          </h3>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {shiftsForSelectedDate.map((shift, index) => (
              <div
                key={`${shift.id}-${index}`}
                onClick={() => handleShiftSelect(index, shift)}
                className={`p-3 border rounded-md cursor-pointer ${
                  selectedShiftIndex === index
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 dark:border-blue-400'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
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
              <div className="text-gray-500 dark:text-gray-400 text-sm">
                No shifts for this date.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shift Editor */}
      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Shift Editor</h3>
          
          {/* Quick Templates */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quick Templates
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DEFAULT_SHIFT_TYPES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => applyShiftTemplate(template)}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                >
                  {template.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Shift ID
              </label>
              <input
                type="text"
                value={shiftForm.id || ''}
                onChange={(e) => handleShiftFormChange('id', e.target.value)}
                placeholder="Auto-generated if empty"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type *
              </label>
              <input
                type="text"
                value={shiftForm.type || ''}
                onChange={(e) => handleShiftFormChange('type', e.target.value)}
                placeholder="e.g., MD_D, MD_N"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Time (HH:MM) *
              </label>
              <input
                type="time"
                value={shiftForm.start || ''}
                onChange={(e) => handleShiftFormChange('start', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Time (HH:MM) *
              </label>
              <input
                type="time"
                value={shiftForm.end || ''}
                onChange={(e) => handleShiftFormChange('end', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="add-all-days"
                checked={addToAllDays}
                onChange={(e) => setAddToAllDays(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded dark:bg-gray-800 dark:border-gray-600 focus:ring-blue-500"
              />
              <label htmlFor="add-all-days" className="ml-2 text-sm text-gray-700">
                Add across ALL calendar days
              </label>
            </div>

            <div className="flex space-x-2 pt-4">
              <button
                onClick={addShift}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Add
              </button>
              {selectedShiftIndex !== null && (
                <>
                  <button
                    onClick={updateShift}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Update
                  </button>
                  <button
                    onClick={deleteShift}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
