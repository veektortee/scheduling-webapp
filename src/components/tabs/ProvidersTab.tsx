'use client';

import { useState } from 'react';
import { useScheduling } from '@/context/SchedulingContext';
import { Provider } from '@/types/scheduling';
import { 
  IoPeopleSharp, 
  IoPersonSharp, 
  IoMedkitSharp,
  IoHeartSharp,
  IoCloseCircleSharp,
  IoWarningSharp,
  IoCheckmarkCircleSharp
} from 'react-icons/io5';
import { PlusCircleIcon, ArrowPathIcon, TrashIcon } from '@heroicons/react/24/solid';
import ProviderCalendar from '@/components/ProviderCalendar';

export default function ProvidersTab() {
  const { state, dispatch } = useScheduling();
  const { case: schedulingCase, selectedProvider } = state;
  const [providerForm, setProviderForm] = useState<Partial<Provider>>({
    name: '',
    type: 'Staff',
    max_consecutive_days: null,
    limits: {
      min_total: 0,
      max_total: null,
    },
    forbidden_days_soft: [],
    forbidden_days_hard: [],
    preferred_days_hard: {},
    preferred_days_soft: {},
  });
  const [selectedOffDays, setSelectedOffDays] = useState<string[]>([]);
  const [selectedOnDays, setSelectedOnDays] = useState<string[]>([]);
  const [calendarMode, setCalendarMode] = useState<'off' | 'on'>('on');

  const handleProviderSelect = (index: number) => {
    dispatch({ type: 'SELECT_PROVIDER', payload: index });
    const provider = schedulingCase.providers[index];
    setProviderForm({
      ...provider,
      limits: provider.limits || { min_total: 0, max_total: null },
      forbidden_days_soft: provider.forbidden_days_soft || [],
      forbidden_days_hard: provider.forbidden_days_hard || [],
      preferred_days_hard: provider.preferred_days_hard || {},
      preferred_days_soft: provider.preferred_days_soft || {},
    });
    // Clear selected days when switching providers
    setSelectedOffDays([]);
    setSelectedOnDays([]);
  };

  const handleProviderFormChange = (field: keyof Provider, value: string | number | null | string[] | Record<string, string[]>) => {
    setProviderForm(prev => ({ ...prev, [field]: value }));
  };

  const handleLimitsChange = (field: string, value: number | null) => {
    setProviderForm(prev => ({
      ...prev,
      limits: {
        ...prev.limits,
        [field]: value,
      },
    }));
  };

  const addProvider = () => {
    if (!providerForm.name) {
      alert('Please enter a provider name');
      return;
    }

    const newProvider: Provider = {
      id: providerForm.id || `provider_${Date.now()}`,
      name: providerForm.name,
      type: providerForm.type || 'Staff',
      max_consecutive_days: providerForm.max_consecutive_days,
      limits: providerForm.limits || { min_total: 0, max_total: null },
      forbidden_days_soft: providerForm.forbidden_days_soft || [],
      forbidden_days_hard: providerForm.forbidden_days_hard || [],
      preferred_days_hard: providerForm.preferred_days_hard || {},
      preferred_days_soft: providerForm.preferred_days_soft || {},
    };

    dispatch({ type: 'ADD_PROVIDER', payload: newProvider });
    resetForm();
  };

  const updateProvider = () => {
    if (selectedProvider === null) return;

    const updatedProvider: Provider = {
      ...providerForm as Provider,
    };

    dispatch({
      type: 'UPDATE_PROVIDER',
      payload: { index: selectedProvider, provider: updatedProvider },
    });
    resetForm();
  };

  const deleteProvider = () => {
    if (selectedProvider === null) return;
    
    dispatch({ type: 'DELETE_PROVIDER', payload: selectedProvider });
    resetForm();
  };

  const resetForm = () => {
    setProviderForm({
      name: '',
      type: 'Staff',
      max_consecutive_days: null,
      limits: {
        min_total: 0,
        max_total: null,
      },
      forbidden_days_soft: [],
      forbidden_days_hard: [],
      preferred_days_hard: {},
      preferred_days_soft: {},
    });
    dispatch({ type: 'SELECT_PROVIDER', payload: null });
    // Clear selected days when resetting form
    setSelectedOffDays([]);
    setSelectedOnDays([]);
  };

  const applyFixedOffDays = () => {
    if (selectedProvider === null) return;
    
    // Use the currently selected days based on the calendar mode
    const daysToApply = calendarMode === 'off' ? selectedOffDays : selectedOnDays;
    if (daysToApply.length === 0) return;
    
    const provider = schedulingCase.providers[selectedProvider];
    
    // Clear any existing preferences for these days first (override functionality)
    const updatedProvider: Provider = {
      ...provider,
      forbidden_days_hard: [...(provider.forbidden_days_hard || []), ...daysToApply],
      forbidden_days_soft: (provider.forbidden_days_soft || []).filter(day => !daysToApply.includes(day)),
      preferred_days_hard: Object.fromEntries(
        Object.entries(provider.preferred_days_hard || {}).filter(([day]) => !daysToApply.includes(day))
      ),
      preferred_days_soft: Object.fromEntries(
        Object.entries(provider.preferred_days_soft || {}).filter(([day]) => !daysToApply.includes(day))
      ),
    };

    dispatch({
      type: 'UPDATE_PROVIDER',
      payload: { index: selectedProvider, provider: updatedProvider },
    });
    
    // Clear both selected arrays and update form
    setSelectedOffDays([]);
    setSelectedOnDays([]);
    setProviderForm({
      ...updatedProvider,
      limits: updatedProvider.limits || { min_total: 0, max_total: null },
      forbidden_days_soft: updatedProvider.forbidden_days_soft || [],
      forbidden_days_hard: updatedProvider.forbidden_days_hard || [],
      preferred_days_hard: updatedProvider.preferred_days_hard || {},
      preferred_days_soft: updatedProvider.preferred_days_soft || {},
    });
  };

  const applyPreferOffDays = () => {
    if (selectedProvider === null) return;
    
    // Use the currently selected days based on the calendar mode
    const daysToApply = calendarMode === 'off' ? selectedOffDays : selectedOnDays;
    if (daysToApply.length === 0) return;
    
    const provider = schedulingCase.providers[selectedProvider];
    
    // Clear any existing preferences for these days first (override functionality)
    const updatedProvider: Provider = {
      ...provider,
      forbidden_days_hard: (provider.forbidden_days_hard || []).filter(day => !daysToApply.includes(day)),
      forbidden_days_soft: [...(provider.forbidden_days_soft || []), ...daysToApply],
      preferred_days_hard: Object.fromEntries(
        Object.entries(provider.preferred_days_hard || {}).filter(([day]) => !daysToApply.includes(day))
      ),
      preferred_days_soft: Object.fromEntries(
        Object.entries(provider.preferred_days_soft || {}).filter(([day]) => !daysToApply.includes(day))
      ),
    };

    dispatch({
      type: 'UPDATE_PROVIDER',
      payload: { index: selectedProvider, provider: updatedProvider },
    });
    
    // Clear both selected arrays and update form
    setSelectedOffDays([]);
    setSelectedOnDays([]);
    setProviderForm({
      ...updatedProvider,
      limits: updatedProvider.limits || { min_total: 0, max_total: null },
      forbidden_days_soft: updatedProvider.forbidden_days_soft || [],
      forbidden_days_hard: updatedProvider.forbidden_days_hard || [],
      preferred_days_hard: updatedProvider.preferred_days_hard || {},
      preferred_days_soft: updatedProvider.preferred_days_soft || {},
    });
  };

  const applyPreferOnDays = () => {
    if (selectedProvider === null) return;
    
    // Use the currently selected days based on the calendar mode
    const daysToApply = calendarMode === 'on' ? selectedOnDays : selectedOffDays;
    if (daysToApply.length === 0) return;
    
    const provider = schedulingCase.providers[selectedProvider];
    const shiftTypes = ['DAY', 'EVENING', 'NIGHT', 'WEEKEND', 'FLEX'];
    
    // Clear any existing preferences for these days first (override functionality)
    const newPreferredDaysSoft = { ...provider.preferred_days_soft };
    daysToApply.forEach(day => {
      newPreferredDaysSoft[day] = shiftTypes;
    });

    const updatedProvider: Provider = {
      ...provider,
      forbidden_days_hard: (provider.forbidden_days_hard || []).filter(day => !daysToApply.includes(day)),
      forbidden_days_soft: (provider.forbidden_days_soft || []).filter(day => !daysToApply.includes(day)),
      preferred_days_hard: Object.fromEntries(
        Object.entries(provider.preferred_days_hard || {}).filter(([day]) => !daysToApply.includes(day))
      ),
      preferred_days_soft: newPreferredDaysSoft,
    };

    dispatch({
      type: 'UPDATE_PROVIDER',
      payload: { index: selectedProvider, provider: updatedProvider },
    });
    
    // Clear both selected arrays and update form
    setSelectedOnDays([]);
    setSelectedOffDays([]);
    setProviderForm({
      ...updatedProvider,
      limits: updatedProvider.limits || { min_total: 0, max_total: null },
      forbidden_days_soft: updatedProvider.forbidden_days_soft || [],
      forbidden_days_hard: updatedProvider.forbidden_days_hard || [],
      preferred_days_hard: updatedProvider.preferred_days_hard || {},
      preferred_days_soft: updatedProvider.preferred_days_soft || {},
    });
  };

  const applyFixedOnDays = () => {
    if (selectedProvider === null) return;
    
    // Use the currently selected days based on the calendar mode
    const daysToApply = calendarMode === 'on' ? selectedOnDays : selectedOffDays;
    if (daysToApply.length === 0) return;
    
    const provider = schedulingCase.providers[selectedProvider];
    const shiftTypes = ['DAY', 'EVENING', 'NIGHT', 'WEEKEND', 'FLEX'];
    
    // Clear any existing preferences for these days first (override functionality)
    const newPreferredDaysHard = { ...provider.preferred_days_hard };
    daysToApply.forEach(day => {
      newPreferredDaysHard[day] = shiftTypes;
    });

    const updatedProvider: Provider = {
      ...provider,
      forbidden_days_hard: (provider.forbidden_days_hard || []).filter(day => !daysToApply.includes(day)),
      forbidden_days_soft: (provider.forbidden_days_soft || []).filter(day => !daysToApply.includes(day)),
      preferred_days_hard: newPreferredDaysHard,
      preferred_days_soft: Object.fromEntries(
        Object.entries(provider.preferred_days_soft || {}).filter(([day]) => !daysToApply.includes(day))
      ),
    };

    dispatch({
      type: 'UPDATE_PROVIDER',
      payload: { index: selectedProvider, provider: updatedProvider },
    });
    
    // Clear both selected arrays and update form
    setSelectedOnDays([]);
    setSelectedOffDays([]);
    setProviderForm({
      ...updatedProvider,
      limits: updatedProvider.limits || { min_total: 0, max_total: null },
      forbidden_days_soft: updatedProvider.forbidden_days_soft || [],
      forbidden_days_hard: updatedProvider.forbidden_days_hard || [],
      preferred_days_hard: updatedProvider.preferred_days_hard || {},
      preferred_days_soft: updatedProvider.preferred_days_soft || {},
    });
  };

  const handleDayClear = (day: string) => {
    if (selectedProvider === null) return;
    
    const provider = schedulingCase.providers[selectedProvider];
    
    // Remove from all possible arrays/objects
    const updatedProvider: Provider = {
      ...provider,
      forbidden_days_hard: (provider.forbidden_days_hard || []).filter(d => d !== day),
      forbidden_days_soft: (provider.forbidden_days_soft || []).filter(d => d !== day),
      preferred_days_hard: Object.fromEntries(
        Object.entries(provider.preferred_days_hard || {}).filter(([d]) => d !== day)
      ),
      preferred_days_soft: Object.fromEntries(
        Object.entries(provider.preferred_days_soft || {}).filter(([d]) => d !== day)
      ),
    };

    dispatch({
      type: 'UPDATE_PROVIDER',
      payload: { index: selectedProvider, provider: updatedProvider },
    });
    
    // Update form state
    setProviderForm({
      ...updatedProvider,
      limits: updatedProvider.limits || { min_total: 0, max_total: null },
      forbidden_days_soft: updatedProvider.forbidden_days_soft || [],
      forbidden_days_hard: updatedProvider.forbidden_days_hard || [],
      preferred_days_hard: updatedProvider.preferred_days_hard || {},
      preferred_days_soft: updatedProvider.preferred_days_soft || {},
    });
  };

  const handleDayToggle = (day: string, selected: boolean) => {
    console.log(`Day toggle: ${day}, selected: ${selected}, mode: ${calendarMode}`);
    
    if (calendarMode === 'off') {
      if (selected) {
        setSelectedOffDays(prev => [...prev, day]);
      } else {
        setSelectedOffDays(prev => prev.filter(d => d !== day));
      }
    } else {
      if (selected) {
        setSelectedOnDays(prev => [...prev, day]);
      } else {
        setSelectedOnDays(prev => prev.filter(d => d !== day));
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Providers List */}
        <div className="lg:col-span-1">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8 hover-glow">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <IoPeopleSharp className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gradient">
                Providers
              </h3>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
            {schedulingCase.providers.map((provider, index) => (
              <div
                key={provider.id || index}
                onClick={() => handleProviderSelect(index)}
                className={`p-3 border rounded-md cursor-pointer ${
                  selectedProvider === index
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 dark:border-blue-400'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {provider.name || provider.id || `Provider ${index + 1}`}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{provider.type}</div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  Off days: {(provider.forbidden_days_soft || []).length + (provider.forbidden_days_hard || []).length}
                </div>
              </div>
            ))}
            {schedulingCase.providers.length === 0 && (
              <div className="text-gray-500 dark:text-gray-400 text-sm">No providers yet.</div>
            )}
          </div>

          {/* Provider Form */}
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={providerForm.name || ''}
                onChange={(e) => handleProviderFormChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type
              </label>
              <select
                value={providerForm.type || 'Staff'}
                onChange={(e) => handleProviderFormChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Staff">Staff</option>
                <option value="Manager">Manager</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Lead">Lead</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Consecutive Days
              </label>
              <input
                type="number"
                value={providerForm.max_consecutive_days || ''}
                onChange={(e) => handleProviderFormChange('max_consecutive_days', 
                  e.target.value ? parseInt(e.target.value) : null)}
                placeholder="No limit"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Min Total Shifts
              </label>
              <input
                type="number"
                value={providerForm.limits?.min_total || 0}
                onChange={(e) => handleLimitsChange('min_total', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Total Shifts
              </label>
              <input
                type="number"
                value={providerForm.limits?.max_total || ''}
                onChange={(e) => handleLimitsChange('max_total', 
                  e.target.value ? parseInt(e.target.value) : null)}
                placeholder="No limit"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={addProvider}
                className="flex-1 relative px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-semibold flex items-center justify-center space-x-2 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 border border-green-500/20 overflow-hidden group"
              >
                <div className="absolute inset-0 z-0 bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <PlusCircleIcon className="w-6 h-6 shrink-0 relative z-20 text-white fill-white" aria-hidden="true" />
                <span className="relative z-20 font-bold">Add</span>
              </button>
              {selectedProvider !== null && (
                <>
                  <button
                    onClick={updateProvider}
                    className="flex-1 relative px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold flex items-center justify-center space-x-2 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 border border-blue-500/20 overflow-hidden group"
                  >
                    <div className="absolute inset-0 z-0 bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                    <ArrowPathIcon className="w-6 h-6 shrink-0 relative z-20 text-white fill-white" aria-hidden="true" />
                    <span className="relative z-20 font-bold">Update</span>
                  </button>
                  <button
                    onClick={deleteProvider}
                    className="flex-1 relative px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 font-semibold flex items-center justify-center space-x-2 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 border border-red-500/20 overflow-hidden group"
                  >
                    <div className="absolute inset-0 z-0 bg-gradient-to-r from-red-400 to-rose-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                    <TrashIcon className="w-6 h-6 shrink-0 relative z-20 text-white fill-white" aria-hidden="true" />
                    <span className="relative z-20 font-bold">Delete</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Selection for Days Off/On */}
      <div className="lg:col-span-1">
        {/* Status indicator */}
        {selectedProvider !== null && (
          <div className="mb-4 p-3 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/30 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Editing: <span className="font-bold text-blue-600 dark:text-blue-400">{schedulingCase.providers[selectedProvider]?.name}</span>
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Available days: {schedulingCase.calendar.days.length} • Mode: <span className={calendarMode === 'off' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}>{calendarMode === 'off' ? 'Days OFF' : 'Days ON'}</span>
            </p>
          </div>
        )}
        
        {/* Mode Toggle */}
        <div className="mb-3">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 w-full sm:w-fit mx-auto">
            <button
              onClick={() => {
                setCalendarMode('off');
                // Optionally clear the other mode's selection to avoid confusion
                if (selectedOnDays.length > 0) {
                  // setSelectedOnDays([]);
                }
              }}
              className={`flex-1 sm:flex-none px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 ${
                calendarMode === 'off'
                  ? 'bg-red-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Days OFF {selectedOffDays.length > 0 && `(${selectedOffDays.length})`}
            </button>
            <button
              onClick={() => {
                setCalendarMode('on');
                // Optionally clear the other mode's selection to avoid confusion
                if (selectedOffDays.length > 0) {
                  // setSelectedOffDays([]);
                }
              }}
              className={`flex-1 sm:flex-none px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 ${
                calendarMode === 'on'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Days ON {selectedOnDays.length > 0 && `(${selectedOnDays.length})`}
            </button>
          </div>
        </div>

        <ProviderCalendar
          availableDays={schedulingCase.calendar.days}
          selectedDays={calendarMode === 'off' ? selectedOffDays : selectedOnDays}
          onDayToggle={handleDayToggle}
          onDayClear={handleDayClear}
          fixedOffDays={selectedProvider !== null ? schedulingCase.providers[selectedProvider]?.forbidden_days_hard || [] : []}
          preferOffDays={selectedProvider !== null ? schedulingCase.providers[selectedProvider]?.forbidden_days_soft || [] : []}
          fixedOnDays={selectedProvider !== null ? Object.keys(schedulingCase.providers[selectedProvider]?.preferred_days_hard || {}) : []}
          preferOnDays={selectedProvider !== null ? Object.keys(schedulingCase.providers[selectedProvider]?.preferred_days_soft || {}) : []}
          mode={calendarMode}
          disabled={selectedProvider === null}
          className="h-120"
        />
        
        {/* Action buttons */}
        <div className="mt-4 space-y-2">
          {/* Clear selection button */}
          {(selectedOffDays.length > 0 || selectedOnDays.length > 0) && (
            <button
              onClick={() => {
                setSelectedOffDays([]);
                setSelectedOnDays([]);
              }}
              className="w-full relative px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all duration-300 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Clear Selection ({calendarMode === 'off' ? selectedOffDays.length : selectedOnDays.length})</span>
            </button>
          )}
          
          {calendarMode === 'off' ? (
            <>
              <button
                onClick={applyFixedOffDays}
                disabled={selectedProvider === null || (selectedOffDays.length === 0 && selectedOnDays.length === 0)}
                className="w-full relative px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:from-red-700 hover:to-rose-700 font-semibold flex items-center justify-center space-x-2 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 border border-red-500/20 overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-rose-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <IoCloseCircleSharp className="w-5 h-5 relative z-20 text-white drop-shadow-sm" />
                <span className="relative z-20 font-bold">Set FIXED OFF</span>
              </button>
              <button
                onClick={applyPreferOffDays}
                disabled={selectedProvider === null || (selectedOffDays.length === 0 && selectedOnDays.length === 0)}
                className="w-full relative px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 font-semibold flex items-center justify-center space-x-2 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 border border-orange-500/20 overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-amber-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <IoWarningSharp className="w-5 h-5 relative z-20 text-white drop-shadow-sm" />
                <span className="relative z-20 font-bold">Set PREFER OFF</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={applyFixedOnDays}
                disabled={selectedProvider === null || (selectedOnDays.length === 0 && selectedOffDays.length === 0)}
                className="w-full relative px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-semibold flex items-center justify-center space-x-2 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 border border-green-500/20 overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <IoCheckmarkCircleSharp className="w-5 h-5 relative z-20 text-white drop-shadow-sm" />
                <span className="relative z-20 font-bold">Set FIXED ON</span>
              </button>
              <button
                onClick={applyPreferOnDays}
                disabled={selectedProvider === null || (selectedOnDays.length === 0 && selectedOffDays.length === 0)}
                className="w-full relative px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-semibold flex items-center justify-center space-x-2 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 border border-blue-500/20 overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <IoHeartSharp className="w-5 h-5 relative z-20 text-white drop-shadow-sm" />
                <span className="relative z-20 font-bold">Set PREFER ON</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Provider Summary */}
      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Provider Summary</h3>
          {selectedProvider !== null && schedulingCase.providers[selectedProvider] ? (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  {schedulingCase.providers[selectedProvider].name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Type: {schedulingCase.providers[selectedProvider].type}
                </p>
              </div>

              <div>
                <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Fixed OFF Days</h5>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {(schedulingCase.providers[selectedProvider].forbidden_days_hard || []).length === 0 ? (
                    <span className="text-gray-400 dark:text-gray-500">None</span>
                  ) : (
                    <div className="space-y-1">
                      {(schedulingCase.providers[selectedProvider].forbidden_days_hard || []).map(day => (
                        <div key={day} className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs inline-block mr-1">
                          {day}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Prefer OFF Days</h5>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {(schedulingCase.providers[selectedProvider].forbidden_days_soft || []).length === 0 ? (
                    <span className="text-gray-400 dark:text-gray-500">None</span>
                  ) : (
                    <div className="space-y-1">
                      {(schedulingCase.providers[selectedProvider].forbidden_days_soft || []).map(day => (
                        <div key={day} className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs inline-block mr-1 mb-1">
                          {day}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Prefer ON Days</h5>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {Object.keys(schedulingCase.providers[selectedProvider].preferred_days_soft || {}).length === 0 ? (
                    <span className="text-gray-400 dark:text-gray-500">None</span>
                  ) : (
                    <div className="space-y-1">
                      {Object.keys(schedulingCase.providers[selectedProvider].preferred_days_soft || {}).map(day => (
                        <div key={day} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs inline-block mr-1 mb-1">
                          {day}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Fixed ON Days</h5>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {Object.keys(schedulingCase.providers[selectedProvider].preferred_days_hard || {}).length === 0 ? (
                    <span className="text-gray-400 dark:text-gray-500">None</span>
                  ) : (
                    <div className="space-y-1">
                      {Object.keys(schedulingCase.providers[selectedProvider].preferred_days_hard || {}).map(day => (
                        <div key={day} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs inline-block mr-1 mb-1">
                          {day}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Limits</h5>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <div>Min shifts: {schedulingCase.providers[selectedProvider].limits?.min_total || 0}</div>
                  <div>Max shifts: {schedulingCase.providers[selectedProvider].limits?.max_total || 'No limit'}</div>
                  <div>Max consecutive: {schedulingCase.providers[selectedProvider].max_consecutive_days || 'No limit'}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500 dark:text-gray-400 text-sm">
              Select a provider to view details
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Provider Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl shadow-lg border border-blue-200/50 dark:border-blue-800/50 p-6 hover-glow hover:scale-105 transition-all duration-300">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <IoPeopleSharp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{schedulingCase.providers.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl shadow-lg border border-green-200/50 dark:border-green-800/50 p-6 hover-glow hover:scale-105 transition-all duration-300">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <IoMedkitSharp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Staff</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {schedulingCase.providers.filter(p => p.type === 'Staff').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl shadow-lg border border-purple-200/50 dark:border-purple-800/50 p-6 hover-glow hover:scale-105 transition-all duration-300">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <IoHeartSharp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Manager</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {schedulingCase.providers.filter(p => p.type === 'Manager').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl shadow-lg border border-orange-200/50 dark:border-orange-800/50 p-6 hover-glow hover:scale-105 transition-all duration-300">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <IoPersonSharp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Idle</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {schedulingCase.providers.filter(p => 
                  (!p.forbidden_days_hard || p.forbidden_days_hard.length === 0) &&
                  (!p.forbidden_days_soft || p.forbidden_days_soft.length === 0) &&
                  (!p.preferred_days_hard || Object.keys(p.preferred_days_hard).length === 0) &&
                  (!p.preferred_days_soft || Object.keys(p.preferred_days_soft).length === 0)
                ).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
