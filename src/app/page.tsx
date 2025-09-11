'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useScheduling } from '@/context/SchedulingContext';
import { loadCaseFromFile } from '@/lib/scheduling';
import { exportCurrentCaseToExcel, generateMockResults, exportScheduleToExcel } from '@/lib/excelExport';
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
  const { data: session, status } = useSession();
  const router = useRouter();
  const { state, dispatch } = useScheduling();
  const [activeTab, setActiveTab] = useState<TabType>('run');
  const [isInitialized, setIsInitialized] = useState(false);

  // Authentication check - redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return; // Still loading
    
    console.log('🔍 Auth status:', { status, session: !!session, role: session?.user?.role });
    
    if (!session) {
      console.log('❌ No session found, redirecting to login');
      router.push('/login');
      return;
    }
    
    if (session.user?.role !== 'admin') {
      console.log('❌ User is not admin, redirecting to login');
      router.push('/login');
      return;
    }
    
    console.log('✅ User is authenticated with admin role');
  }, [session, status, router]);

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

  // Show loading screen while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-slate-50/50 to-blue-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (user will be redirected)
  if (!session || session.user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-slate-50/50 to-blue-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-slate-800">
        <div className="text-center">
          <p className="text-lg text-gray-600 dark:text-gray-300">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-slate-50/50 to-blue-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-slate-800 relative">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/10 via-transparent to-teal-50/10 dark:from-blue-900/5 dark:via-transparent dark:to-teal-900/5"></div>
        <div className="relative text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-12">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 mx-auto"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-white dark:border-gray-800 absolute top-2 left-1/2 transform -translate-x-1/2"></div>
          </div>
          <div className="mt-8">
            <p className="text-2xl font-bold text-gradient">
              Medical Staff Scheduling
            </p>
            <div className="flex items-center justify-center space-x-2 mt-2">
              <div className="h-1 w-16 bg-gradient-to-r from-slate-400 via-blue-500 to-teal-500 rounded-full animate-pulse"></div>
              <div className="h-2 w-2 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full animate-bounce"></div>
            </div>
            <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">
              Loading your scheduling system...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50/50 to-blue-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-slate-800 relative">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/10 via-transparent to-teal-50/10 dark:from-blue-900/5 dark:via-transparent dark:to-teal-900/5 pointer-events-none"></div>
        <div className="relative">
        {/* Header */}
        <header className="header-gradient shadow-lg border-b border-gray-200 dark:border-gray-700 relative overflow-hidden">
          <div className="absolute inset-0 header-overlay"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center py-4 lg:py-8 space-y-4 lg:space-y-0">
              <div className="flex flex-col space-y-2">
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-gradient break-words">
                    Medical Staff Scheduling System
                  </h1>
                </div>
                <div className="flex items-center space-x-2 -mt-1">
                  <div className="h-1 w-20 bg-gradient-to-r from-slate-400 via-blue-500 to-teal-500 rounded-full shadow-sm"></div>
                  <div className="h-2 w-2 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full animate-pulse"></div>
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 tracking-wide leading-relaxed">
                  Advanced scheduling and optimization for medical staff
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-2 lg:space-x-4">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 lg:space-x-3">
                  <button
                    onClick={handleExportConfiguration}
                    className="relative px-4 lg:px-6 py-2 lg:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 text-sm lg:text-base font-semibold flex items-center justify-center space-x-2 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 border border-green-500/20 overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                    <IoDocumentTextSharp className="w-4 h-4 lg:w-5 lg:h-5 relative z-10 group-hover:scale-110 transition-transform duration-200" />
                    <span className="relative z-10">Export Config</span>
                  </button>
                  <button
                    onClick={handleExportResults}
                    className="relative px-4 lg:px-6 py-2 lg:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 text-sm lg:text-base font-semibold flex items-center justify-center space-x-2 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 border border-blue-500/20 overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                    <IoStatsChartSharp className="w-4 h-4 lg:w-5 lg:h-5 relative z-10 group-hover:scale-110 transition-transform duration-200" />
                    <span className="relative z-10">Export Results</span>
                  </button>
                </div>
                {state.error && (
                  <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 text-red-800 px-4 lg:px-6 py-3 lg:py-4 rounded-xl shadow-lg backdrop-blur-sm animate-fade-in-up">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="font-medium text-sm lg:text-base break-words">{state.error}</span>
                    </div>
                  </div>
                )}
                <button
                  onClick={handleSignOut}
                  className="relative px-4 lg:px-6 py-2 lg:py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 text-sm lg:text-base font-semibold transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 border border-red-500/20 overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-rose-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  <span className="relative z-10">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </header>

      {/* Tab Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-lg border-b-2 border-gray-200 dark:border-gray-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap sm:flex-nowrap overflow-x-auto space-x-1">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`py-3 lg:py-4 px-3 sm:px-4 lg:px-6 font-semibold text-sm lg:text-base flex items-center space-x-2 lg:space-x-3 transition-all duration-200 min-w-[100px] sm:min-w-[120px] lg:min-w-[140px] justify-center border-b-3 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-600 dark:border-blue-400'
                      : 'text-gray-700 dark:text-gray-300 border-transparent hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <IconComponent className="w-4 h-4 lg:w-5 lg:h-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

          {/* Tab Content */}
          <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-4 lg:p-6 overflow-hidden">
              {renderActiveTab()}
            </div>
          </main>
        </div>
      </div>
  );
}
