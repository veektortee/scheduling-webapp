'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useScheduling } from '@/context/SchedulingContext';
import { loadCaseFromFile } from '@/lib/scheduling';
import { exportCurrentCaseToExcel, generateMockResults, exportScheduleToExcel } from '@/lib/excelExport';
import AuthGuard from '@/components/AuthGuard';
import RunTab from '@/components/tabs/RunTab';
import CalendarTab from '@/components/tabs/CalendarTab';
import ShiftsTab from '@/components/tabs/ShiftsTab';
import ProvidersTab from '@/components/tabs/ProvidersTab';
import ConfigTab from '@/components/tabs/ConfigTab';
import { 
  IoPlaySharp, 
  IoCalendarSharp, 
  IoTimeSharp, 
  IoPeopleSharp, 
  IoSettingsSharp,
  IoDocumentTextSharp,
  IoStatsChartSharp
} from 'react-icons/io5';

type TabType = 'run' | 'calendar' | 'shifts' | 'providers' | 'config';

export default function Home() {
  useSession(); // Authentication check is handled by AuthGuard
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
      } catch {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load case data' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, [dispatch]);

  const handleExportConfiguration = () => {
    exportCurrentCaseToExcel(state.case);
  };

  const handleExportResults = () => {
    // Generate mock results for demo
    const mockResults = generateMockResults(state.case);
    exportScheduleToExcel(state.case, mockResults);
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  const tabs = [
    { id: 'run', label: 'Run', icon: IoPlaySharp },
    { id: 'calendar', label: 'Calendar', icon: IoCalendarSharp },
    { id: 'shifts', label: 'Shifts', icon: IoTimeSharp },
    { id: 'providers', label: 'Providers', icon: IoPeopleSharp },
    { id: 'config', label: 'Config', icon: IoSettingsSharp },
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
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Medical Staff Scheduling System
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Advanced scheduling and optimization for medical staff
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex space-x-3">
                  <button
                    onClick={handleExportConfiguration}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-base font-medium flex items-center space-x-2 transition-colors shadow-md hover:shadow-lg"
                  >
                    <IoDocumentTextSharp className="w-5 h-5" />
                    <span>Export Config</span>
                  </button>
                  <button
                    onClick={handleExportResults}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-base font-medium flex items-center space-x-2 transition-colors shadow-md hover:shadow-lg"
                  >
                    <IoStatsChartSharp className="w-5 h-5" />
                    <span>Export Results</span>
                  </button>
                </div>
                {state.error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {state.error}
                  </div>
                )}
                <button
                  onClick={handleSignOut}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 text-base font-medium transition-colors shadow-md hover:shadow-lg"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>

      {/* Tab Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-4">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`py-6 px-6 border-b-2 font-semibold text-lg flex items-center space-x-3 transition-colors min-w-[140px] justify-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <IconComponent className="w-6 h-6" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

        {/* Tab Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {renderActiveTab()}
        </main>
      </div>
    </AuthGuard>
  );
}
