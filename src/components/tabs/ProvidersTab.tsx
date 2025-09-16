'use client';

import { useState, useEffect } from 'react';
import { useScheduling } from '@/context/SchedulingContext';
import { Provider, DEFAULT_SHIFT_TYPES } from '@/types/scheduling';
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
import SchedulingCalendar from '@/components/SchedulingCalendar';

export default function ProvidersTab() {
  const { state, dispatch } = useScheduling();
  const { case: schedulingCase, selectedProvider } = state;
  const [newProviderType, setNewProviderType] = useState<string>('');
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
  // Note: provider types are managed via the top "Provider Types" input; the per-provider editor
  // uses a simple select to choose among those types.
  const [selectedOffDays, setSelectedOffDays] = useState<string[]>([]);
  const [selectedOnDays, setSelectedOnDays] = useState<string[]>([]);
  const [calendarMode, setCalendarMode] = useState<'off' | 'on'>('on');
  const [selectedDateForShifts, setSelectedDateForShifts] = useState<string | null>(null);
  const [selectedOnShiftTypes, setSelectedOnShiftTypes] = useState<string[]>([]);

  // Derive shift type options from multiple sources (case shifts, providers' preferences, defaults)
  // const shiftTypesFromShifts = Array.from(new Set((schedulingCase.shifts || []).map(s => s.type))).filter((type): type is string => Boolean(type));
  // const shiftTypesFromProviders = Array.from(new Set(
  //   (schedulingCase.providers || []).flatMap(p => [
  //     ...Object.values(p.preferred_days_hard || {}).flat(),
  //     ...Object.values(p.preferred_days_soft || {}).flat()
  //   ])
  // )).filter((type): type is string => Boolean(type));
  // const defaultShiftIds = DEFAULT_SHIFT_TYPES.map(s => s.id);
  // const providerTypes = Array.from(new Set(
  //   (schedulingCase.providers || []).map(p => p.type).filter(Boolean)
  // ));
  // if (providerTypes.length === 0) providerTypes.push('Staff');
  // Merge: shift ids, provider-referenced shift types, defaults, then provider types

  // Get unique provider types directly from the providers list.
  const providerTypes = Array.from(new Set(
      (schedulingCase.providers || []).map(p => p.type).filter(Boolean)
  ));
  if (providerTypes.length === 0) providerTypes.push('Staff');
  
  // Get unique shift types ONLY from the shifts you have actually defined.
  const shiftTypeOptions = Array.from(new Set(
    (schedulingCase.shifts || []).map(s => s.type).filter(Boolean)
  ));
  // A helper to show pretty names for default shifts (e.g., "Day Shift" instead of "MD_D")
  const shiftTypeNameMap: Record<string, string> = Object.fromEntries(
    DEFAULT_SHIFT_TYPES.map(st => [st.id, st.name])
  );


  const handleProviderSelect = (index: number) => {
    // If the same provider is clicked again, deselect it
    if (selectedProvider === index) {
      dispatch({ type: 'SELECT_PROVIDER', payload: null });
      resetForm();
      return;
    }
    
    dispatch({ type: 'SELECT_PROVIDER', payload: index });
    const provider = schedulingCase.providers[index];
    setProviderForm({
      ...provider,
      type: provider.type || 'Staff', // Ensure type is set
      limits: provider.limits || { min_total: 0, max_total: null },
      forbidden_days_soft: provider.forbidden_days_soft || [],
      forbidden_days_hard: provider.forbidden_days_hard || [],
      preferred_days_hard: provider.preferred_days_hard || {},
      preferred_days_soft: provider.preferred_days_soft || {},
    });
    // Clear selected days when switching providers
    setSelectedOffDays([]);
    setSelectedOnDays([]);
  // Clear selected shift-type filters when switching providers
  setSelectedOnShiftTypes([]);
    // Clear selected date for shifts when a provider is selected
    setSelectedDateForShifts(null);
  };

  // If available options change, remove any selected types that are no longer valid
  useEffect(() => {
    setSelectedOnShiftTypes(prev => prev.filter(t => shiftTypeOptions.includes(t)));
  }, [shiftTypeOptions]);

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
    // Validate required fields
    if (!providerForm.name || providerForm.name.trim() === '') {
      alert('Provider name is required');
      return;
    }

    const newProvider: Provider = {
      id: (providerForm.id as string) || `p_${Date.now()}`,
      name: providerForm.name?.trim(),
      type: (providerForm.type as string) || 'Staff',
      max_consecutive_days: providerForm.max_consecutive_days || 5,
            limits: {
        min_total: providerForm.limits?.min_total || 0,
        max_total: providerForm.limits?.max_total || 4, // Default to 4
      },
      forbidden_days_soft: providerForm.forbidden_days_soft || [],
      forbidden_days_hard: providerForm.forbidden_days_hard || [],
      preferred_days_hard: providerForm.preferred_days_hard || {},
      preferred_days_soft: providerForm.preferred_days_soft || {},
    };

    dispatch({ type: 'ADD_PROVIDER', payload: newProvider });
    // Reset UI form and selection
    resetForm();
  };

  const updateProvider = () => {
    if (selectedProvider === null) return;

    // Merge with existing provider to avoid losing fields not present in the form
    const existing = schedulingCase.providers[selectedProvider] || {};
    const newLimits = {
      min_total: providerForm.limits?.min_total ?? existing.limits?.min_total ?? 0,
      // --- CHANGE: Enforce mandatory default on update ---
      max_total: providerForm.limits?.max_total ?? existing.limits?.max_total ?? 4, // Default to 4 if null/undefined
    };
    const updatedProvider: Provider = {
      ...existing,
      ...(providerForm as Provider),
      type: (providerForm.type as string) || existing.type || 'Staff',
      
      // --- CHANGE: Enforce mandatory default on update ---
      max_consecutive_days: providerForm.max_consecutive_days ?? existing.max_consecutive_days ?? 5, // Default to 5
      limits: newLimits,
    };

    // Debug: log the provider being sent to the reducer
    console.log('Updating provider:', updatedProvider);

    dispatch({
      type: 'UPDATE_PROVIDER',
      payload: { index: selectedProvider, provider: updatedProvider },
    });

    // Keep provider selected and refresh local form to reflect saved values
    setProviderForm({
      ...updatedProvider,
    });
    dispatch({ type: 'SELECT_PROVIDER', payload: selectedProvider });
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
    setSelectedOffDays([]);
    setSelectedOnDays([]);
    setSelectedDateForShifts(null);
    setSelectedOnShiftTypes([]);
  };

  const applyFixedOffDays = () => {
    if (selectedProvider === null) return;
    const daysToApply = calendarMode === 'off' ? selectedOffDays : selectedOnDays;
    if (daysToApply.length === 0) return;
    const provider = schedulingCase.providers[selectedProvider];
    
    // Clear any existing preferences for these days first (override functionality)
    const updatedProvider: Provider = {
      ...provider,
      forbidden_days_hard: [...new Set([...(provider.forbidden_days_hard || []), ...daysToApply])],
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
    const daysToApply = calendarMode === 'off' ? selectedOffDays : selectedOnDays;
    if (daysToApply.length === 0) return;
    const provider = schedulingCase.providers[selectedProvider];
    
    // Clear any existing preferences for these days first (override functionality)
    const updatedProvider: Provider = {
      ...provider,
      forbidden_days_hard: (provider.forbidden_days_hard || []).filter(day => !daysToApply.includes(day)),
      forbidden_days_soft: [...new Set([...(provider.forbidden_days_soft || []), ...daysToApply])],
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
    const daysToApply = calendarMode === 'on' ? selectedOnDays : selectedOffDays;
    if (daysToApply.length === 0) return;
    if (selectedOnShiftTypes.length === 0) {
      alert('Please select one or more shift types to apply for PREFER ON');
      return;
    }

    const provider = schedulingCase.providers[selectedProvider];
    const newPreferredDaysSoft = { ...(provider.preferred_days_soft || {}) };
    daysToApply.forEach(day => {
      newPreferredDaysSoft[day] = selectedOnShiftTypes;
    });

    const updatedProvider: Provider = {
      ...provider,
      preferred_days_soft: newPreferredDaysSoft,
      // Clear other preferences on these days to avoid conflicts
      forbidden_days_hard: (provider.forbidden_days_hard || []).filter(day => !daysToApply.includes(day)),
      forbidden_days_soft: (provider.forbidden_days_soft || []).filter(day => !daysToApply.includes(day)),
      preferred_days_hard: Object.fromEntries(
        Object.entries(provider.preferred_days_hard || {}).filter(([day]) => !daysToApply.includes(day))
      ),
    };

    dispatch({
      type: 'UPDATE_PROVIDER',
      payload: { index: selectedProvider, provider: updatedProvider },
    });

    // Reset selections after applying
    setSelectedOnDays([]);
    setSelectedOffDays([]);
    setProviderForm(updatedProvider);
  };

  const applyFixedOnDays = () => {
    if (selectedProvider === null) return;
    const daysToApply = calendarMode === 'on' ? selectedOnDays : selectedOffDays;
    if (daysToApply.length === 0) return;
    if (selectedOnShiftTypes.length === 0) {
      alert('Please select one or more shift types to apply for FIXED ON');
      return;
    }

    const provider = schedulingCase.providers[selectedProvider];
    const newPreferredDaysHard = { ...(provider.preferred_days_hard || {}) };
    daysToApply.forEach(day => {
      newPreferredDaysHard[day] = selectedOnShiftTypes;
    });

    const updatedProvider: Provider = {
      ...provider,
      preferred_days_hard: newPreferredDaysHard,
      // Clear other preferences on these days to avoid conflicts
      forbidden_days_hard: (provider.forbidden_days_hard || []).filter(day => !daysToApply.includes(day)),
      forbidden_days_soft: (provider.forbidden_days_soft || []).filter(day => !daysToApply.includes(day)),
      preferred_days_soft: Object.fromEntries(
        Object.entries(provider.preferred_days_soft || {}).filter(([day]) => !daysToApply.includes(day))
      ),
    };

    dispatch({
      type: 'UPDATE_PROVIDER',
      payload: { index: selectedProvider, provider: updatedProvider },
    });
    
    // Reset selections after applying
    setSelectedOnDays([]);
    setSelectedOffDays([]);
    setProviderForm(updatedProvider);
  };


  const handleDaySelect = (day: string) => {
    if (selectedProvider === null) {
      setSelectedDateForShifts(day);
    }
  };

  const handleDayToggle = (day: string, selected: boolean) => {
    console.log(`Day toggle: ${day}, selected: ${selected}, mode: ${calendarMode}`);
    
    // If no provider is selected, show shift types for this date
    if (selectedProvider === null) {
      if (selected) {
        setSelectedDateForShifts(day);
      } else {
        setSelectedDateForShifts(null);
      }
      return;
    }
    
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
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-6 lg:p-8 hover-glow">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <IoPeopleSharp className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gradient">
                Providers
              </h3>
            </div>
            {/* Provider types management */}
            <div className="mb-4 w-full">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Provider Types</label>
              <div className="flex flex-col sm:flex-row items-center gap-2 mb-2 w-full">
                <input
                  type="text"
                  value={newProviderType}
                  onChange={(e) => setNewProviderType(e.target.value)}
                  placeholder="Add type (e.g. NP, PA)"
                  className="flex-1 min-w-0 px-2 py-1 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-white"
                />
                <button
                  onClick={() => {
                    const t = (newProviderType || '').trim();
                    if (!t) return;
                    const types = Array.from(new Set([...(schedulingCase.provider_types || []), t]));
                    dispatch({ type: 'UPDATE_CASE', payload: { provider_types: types } });
                    setNewProviderType('');
                  }}
                  className="w-full sm:w-auto px-3 py-1.5 flex-shrink-0 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 text-center"
                >Add type</button>
              </div>
              <div className="flex flex-wrap gap-2 max-w-full">
                {(schedulingCase.provider_types || []).map((type) => (
                  <div key={type} className="inline-flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md text-sm max-w-[12rem]">
                        <span className="font-medium truncate max-w-[9rem]">{type}</span>
                        <button
                          onClick={() => {
                            const types = (schedulingCase.provider_types || []).filter(t => t !== type);
                            // Also clear any providers that were using this type (set to 'Staff')
                            const updatedProviders = schedulingCase.providers.map(p => p.type === type ? { ...p, type: 'Staff' } : p);
                            dispatch({ type: 'UPDATE_CASE', payload: { provider_types: types, providers: updatedProviders } });
                          }}
                          title="Remove type"
                          aria-label={`Remove provider type ${type}`}
                          className="ml-1 w-3 h-3 flex items-center justify-center  hover:bg-red-700 text-white rounded-full text-[9px] shrink-0"
                        >
                          ✕
                        </button>
                  </div>
                ))}
              </div>
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
                <div className="text-sm text-gray-600 dark:text-gray-400">{provider.type || 'Staff'}</div>
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
                {providerTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
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
        {selectedProvider !== null ? (
          <div className="mb-4 p-3 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/30 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Editing: <span className="font-bold text-blue-600 dark:text-blue-400">{schedulingCase.providers[selectedProvider]?.name}</span>
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Mode: <span className={calendarMode === 'off' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}>{calendarMode === 'off' ? 'Days OFF' : 'Days ON'}</span>
            </p>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Default Mode
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Click on a date to see shift types, or select a provider to manage their preferences
            </p>
          </div>
        )}
        
        {/* Mode Toggle - only show when provider is selected */}
        {selectedProvider !== null && (
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
        )}

        <SchedulingCalendar
          availableDays={schedulingCase.calendar.days}
          selectedDays={selectedProvider === null ? (selectedDateForShifts ? [selectedDateForShifts] : []) : (calendarMode === 'off' ? selectedOffDays : selectedOnDays)}
          onDayToggle={handleDayToggle}
          onDaySelect={handleDaySelect}
          mode={selectedProvider === null ? 'single' : 'multiple'}
          minDate={new Date().toISOString().split('T')[0]} // Only allow dates from today onwards
          className="h-120"
        />
        {/* Shift type selector for ON preferences (required) */}
        {selectedProvider !== null && (
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Shift types to apply (required)</label>
            <div className="flex flex-wrap gap-2">
              {shiftTypeOptions.map((st) => {
                if (!st) return null; // Skip undefined values
                const active = selectedOnShiftTypes.includes(st);
                const label = shiftTypeNameMap[st] || st;
                return (
                  <button
                    key={st}
                    onClick={() => {
                      setSelectedOnShiftTypes(prev => prev.includes(st) ? prev.filter(s => s !== st) : [...prev, st]);
                    }}
                    className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${active ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200'}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-red-600 mt-2">Please select one or more shift types before applying FIXED ON / PREFER ON.</p>
          </div>
        )}
        {/* Action buttons - only show when provider is selected */}
        {selectedProvider !== null && (
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
                disabled={selectedProvider === null || (selectedOnDays.length === 0 && selectedOffDays.length === 0) || selectedOnShiftTypes.length === 0}
                className="w-full relative px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-semibold flex items-center justify-center space-x-2 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 border border-green-500/20 overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <IoCheckmarkCircleSharp className="w-5 h-5 relative z-20 text-white drop-shadow-sm" />
                <span className="relative z-20 font-bold">Set FIXED ON</span>
              </button>
              <button
                onClick={applyPreferOnDays}
                disabled={selectedProvider === null || (selectedOnDays.length === 0 && selectedOffDays.length === 0) || selectedOnShiftTypes.length === 0}
                className="w-full relative px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-semibold flex items-center justify-center space-x-2 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 border border-blue-500/20 overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <IoHeartSharp className="w-5 h-5 relative z-20 text-white drop-shadow-sm" />
                <span className="relative z-20 font-bold">Set PREFER ON</span>
              </button>
            </>
          )}
          </div>
        )}
      </div>

      {/* Provider Summary */}
      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            {selectedProvider !== null ? 'Provider Summary' : selectedDateForShifts ? 'Shift Types' : 'Date Information'}
          </h3>
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
          ) : selectedDateForShifts ? (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  {new Date(selectedDateForShifts).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Shift types for this date
                </p>
              </div>

              <div>
                <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Scheduled Shifts</h5>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {(() => {
                    const shiftsForDate = schedulingCase.shifts.filter(shift => shift.date === selectedDateForShifts);
                    return shiftsForDate.length === 0 ? (
                      <span className="text-gray-400 dark:text-gray-500">No shifts scheduled</span>
                    ) : (
                      <div className="space-y-2">
                        {shiftsForDate.map((shift, index) => (
                          <div key={index} className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-2 rounded text-xs border border-blue-200 dark:border-blue-700">
                            <div className="font-medium">{shift.type}</div>
                            <div className="text-xs text-blue-600 dark:text-blue-400">
                              {shift.start} - {shift.end}
                            </div>
                            <div className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                              Allowed: {shift.allowed_provider_types.join(', ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500 dark:text-gray-400 text-sm">
              Select a provider to view details or click on a date to see shift types
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Provider Statistics */}
  <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Undetermined</p>
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
