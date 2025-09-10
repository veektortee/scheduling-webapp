'use client';

import { useState } from 'react';
import { useScheduling } from '@/context/SchedulingContext';
import { Provider } from '@/types/scheduling';

export default function ProvidersTab() {
  const { state, dispatch } = useScheduling();
  const { case: schedulingCase, selectedProvider } = state;
  const [providerForm, setProviderForm] = useState<Partial<Provider>>({
    name: '',
    type: 'MD',
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
  };

  const handleProviderFormChange = (field: keyof Provider, value: any) => {
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
      type: providerForm.type || 'MD',
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
      type: 'MD',
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
  };

  const applyFixedOffDays = () => {
    if (selectedProvider === null) return;
    
    const provider = schedulingCase.providers[selectedProvider];
    const updatedProvider: Provider = {
      ...provider,
      forbidden_days_hard: [...(provider.forbidden_days_hard || []), ...selectedOffDays],
    };

    dispatch({
      type: 'UPDATE_PROVIDER',
      payload: { index: selectedProvider, provider: updatedProvider },
    });
    setSelectedOffDays([]);
  };

  const applyPreferOffDays = () => {
    if (selectedProvider === null) return;
    
    const provider = schedulingCase.providers[selectedProvider];
    const updatedProvider: Provider = {
      ...provider,
      forbidden_days_soft: [...(provider.forbidden_days_soft || []), ...selectedOffDays],
    };

    dispatch({
      type: 'UPDATE_PROVIDER',
      payload: { index: selectedProvider, provider: updatedProvider },
    });
    setSelectedOffDays([]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Providers List */}
      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Providers</h3>
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
                value={providerForm.type || 'MD'}
                onChange={(e) => handleProviderFormChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="MD">MD</option>
                <option value="NP">NP</option>
                <option value="PA">PA</option>
                <option value="RN">RN</option>
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

            <div className="flex space-x-2">
              <button
                onClick={addProvider}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Add
              </button>
              {selectedProvider !== null && (
                <>
                  <button
                    onClick={updateProvider}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Update
                  </button>
                  <button
                    onClick={deleteProvider}
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

      {/* Days Selection (OFF) */}
      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Choose Days (OFF)</h3>
          <div className="max-h-64 overflow-y-auto border rounded-md mb-4">
            {schedulingCase.calendar.days.map((day) => (
              <div
                key={day}
                className={`flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  selectedOffDays.includes(day) ? 'bg-blue-50 dark:bg-blue-900' : ''
                }`}
              >
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedOffDays.includes(day)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOffDays(prev => [...prev, day]);
                      } else {
                        setSelectedOffDays(prev => prev.filter(d => d !== day));
                      }
                    }}
                    className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded dark:bg-gray-800 dark:border-gray-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{day}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <button
              onClick={applyFixedOffDays}
              disabled={selectedProvider === null || selectedOffDays.length === 0}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Set FIXED OFF
            </button>
            <button
              onClick={applyPreferOffDays}
              disabled={selectedProvider === null || selectedOffDays.length === 0}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Set PREFER OFF
            </button>
          </div>
        </div>
      </div>

      {/* Provider Summary */}
      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Provider Summary</h3>
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
                        <div key={day} className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs inline-block mr-1">
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
  );
}
