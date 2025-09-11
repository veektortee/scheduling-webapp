'use client';

import { useEffect, useState } from 'react';
import { useScheduling } from '@/context/SchedulingContext';
import { loadCaseFromFile } from '@/lib/scheduling';
import RunTab from '@/components/tabs/RunTab';
import CalendarTab from '@/components/tabs/CalendarTab';
import ShiftsTab from '@/components/tabs/ShiftsTab';
import ProvidersTab from '@/components/tabs/ProvidersTab';
import ConfigTab from '@/components/tabs/ConfigTab';

type TabType = 'run' | 'calendar' | 'shifts' | 'providers' | 'config';

export default function Home() {
  const { state, dispatch } = useScheduling();
  const [activeTab, setActiveTab] = useState<TabType>('run');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      try {
        const caseData = await loadCaseFromFile();
        if (caseData) {
          dispatch({ type: 'LOAD_CASE', payload: caseData });
        }
      } catch { // Fixed ESLint unused error variable
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load case data' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, [dispatch]);

  const tabs = [
    { id: 'run', label: 'Run', icon: '▶️' },
    { id: 'calendar', label: 'Calendar', icon: '📅' },
    { id: 'shifts', label: 'Shifts', icon: '⏰' },
    { id: 'providers', label: 'Providers', icon: '👥' },
    { id: 'config', label: 'Config', icon: '⚙️' },
  ] as const;

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'run':
        return <RunTab />;
      case 'calendar':
        return <CalendarTab />;
      case 'shifts':
        return <ShiftsTab />;
      case 'providers':
        return <ProvidersTab />;
      case 'config':
        return <ConfigTab />;
      default:
        return <RunTab />;
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg">Loading Scheduling System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Medical Staff Scheduling System
              </h1>
              <p className="text-sm text-gray-600">
                Advanced scheduling and optimization for medical staff
              </p>
            </div>
            {state.error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {state.error}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderActiveTab()}
      </main>
    </div>
  );
}
