'use client';

import { useState } from 'react';
import { useScheduling } from '@/context/SchedulingContext';
import { 
  IoRocketSharp,
  IoSettingsSharp,
  IoPlaySharp,
  IoFolderOpenSharp,
  IoTerminalSharp,
  IoTimeSharp,
  IoTimerSharp
} from 'react-icons/io5';

export default function RunTab() {
  const { state, dispatch } = useScheduling();
  const { case: schedulingCase } = state;
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  const handleRunSolver = async () => {
    setIsRunning(true);
    setProgress(0);
    setLogs(['Starting optimization solver...']);

    // Simulate solver progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const next = prev + Math.random() * 10;
        return next >= 100 ? 100 : next;
      });
    }, 500);

    try {
      // Try connecting to local Python solver first
      setLogs(prev => [...prev, 'Connecting to local Python solver (localhost:8000)...']);
      
      let response;
      try {
        response = await fetch('http://localhost:8000/solve', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(schedulingCase),
        });
        
        if (response.ok) {
          const result = await response.json();
          setLogs(prev => [...prev, 'Local Python solver completed successfully!']);
          setLogs(prev => [...prev, `Run ID: ${result.run_id}`]);
          setLogs(prev => [...prev, `Total assignments: ${result.result?.summary?.total_assignments || 0}`]);
          setLogs(prev => [...prev, `Runtime: ${result.result?.optimization_info?.solver_runtime || 'N/A'}`]);
          setLogs(prev => [...prev, 'Full result:', JSON.stringify(result, null, 2)]);
        } else {
          throw new Error(`Local solver error: ${response.status}`);
        }
      } catch { // Fixed ESLint unused localError variable
        setLogs(prev => [...prev, 'Local solver not available. Trying fallback web solver...']);
        
        // Fallback to web API
        response = await fetch('/api/solve', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(schedulingCase),
        });

        if (response.ok) {
          const result = await response.json();
          setLogs(prev => [...prev, 'Web solver completed successfully!', JSON.stringify(result, null, 2)]);
        } else {
          throw new Error('Both local and web solvers failed');
        }
      }
    } catch {
      setLogs(prev => [...prev, `Error: Unable to connect to solvers. Please ensure:`]);
      setLogs(prev => [...prev, `1. Local Python solver is running: python solver_service.py`]);
      setLogs(prev => [...prev, `2. Or use the demo web solver (limited functionality)`]);
      setLogs(prev => [...prev, `Current case: ${schedulingCase.shifts.length} shifts, ${schedulingCase.providers.length} providers`]);
    } finally {
      clearInterval(progressInterval);
      setProgress(100);
      setIsRunning(false);
    }
  };

  const handleOpenOutputFolder = () => {
    setLogs(prev => [...prev, `Output folder: ${schedulingCase.run.out}`]);
  };

  const updateRunConfig = (field: keyof typeof schedulingCase.run, value: string | number) => {
    dispatch({
      type: 'UPDATE_CASE',
      payload: {
        run: {
          ...schedulingCase.run,
          [field]: value,
        },
      },
    });
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl shadow-lg border border-blue-200/50 dark:border-blue-800/50 p-6 hover-glow hover:scale-105 transition-all duration-300">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">{schedulingCase.shifts.length}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Shifts</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">Scheduled</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl shadow-lg border border-green-200/50 dark:border-green-800/50 p-6 hover-glow hover:scale-105 transition-all duration-300">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">{schedulingCase.providers.length}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Active Providers</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">Available</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl shadow-lg border border-purple-200/50 dark:border-purple-800/50 p-6 hover-glow hover:scale-105 transition-all duration-300">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">AI</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Optimization</p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">Ready</p>
            </div>
          </div>
        </div>
      </div>

      {/* Run Settings */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8 hover-glow">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <IoSettingsSharp className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gradient">
            Run Settings
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Output Folder Name
            </label>
            <input
              type="text"
              value={schedulingCase.run.out}
              onChange={(e) => updateRunConfig('out', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:shadow-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              k (Solutions)
            </label>
            <input
              type="number"
              value={schedulingCase.run.k}
              onChange={(e) => updateRunConfig('k', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:shadow-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              L (Variety)
            </label>
            <input
              type="number"
              value={schedulingCase.run.L}
              onChange={(e) => updateRunConfig('L', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:shadow-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Seed
            </label>
            <input
              type="number"
              value={schedulingCase.run.seed}
              onChange={(e) => updateRunConfig('seed', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:shadow-md"
            />
          </div>
          
          <div>
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <IoTimerSharp className="w-4 h-4" />
              <span>Time (minutes)</span>
            </label>
            <input
              type="number"
              value={schedulingCase.run.time}
              onChange={(e) => updateRunConfig('time', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:shadow-md"
            />
          </div>
        </div>
      </div>

      {/* Run Controls */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8 hover-glow">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <IoRocketSharp className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gradient">
            Optimization Control
          </h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <button
            onClick={handleRunSolver}
            disabled={isRunning}
            className={`relative px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center space-x-3 transition-all duration-300 shadow-lg hover:shadow-2xl overflow-hidden group ${
              isRunning
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700 hover:scale-105'
            }`}
          >
            {!isRunning && <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>}
            {isRunning ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <span>Running Optimization...</span>
              </>
            ) : (
              <>
                <IoPlaySharp className="w-6 h-6" />
                <span>Run Solver</span>
              </>
            )}
          </button>
          
          <button
            onClick={handleOpenOutputFolder}
            className="relative px-6 py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 font-semibold flex items-center space-x-2 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-gray-400 to-gray-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            <IoFolderOpenSharp className="w-5 h-5" />
            <span className="relative z-10">Open Output Folder</span>
          </button>
        </div>

        {/* Progress Bar */}
        {isRunning && (
          <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-xl p-6 border border-blue-200/50 dark:border-blue-800/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Optimization Progress</span>
              </div>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 shadow-inner">
              <div
                className="bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 h-3 rounded-full transition-all duration-500 ease-out shadow-lg"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 text-center">
              🤖 AI is optimizing your schedule...
            </div>
          </div>
        )}
      </div>

      {/* Log Output */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8 hover-glow">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <IoTerminalSharp className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gradient">
            System Log
          </h3>
        </div>
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-green-400 p-6 rounded-xl font-mono text-sm h-80 overflow-y-auto shadow-inner border border-gray-700">
          {logs.length === 0 ? (
            <div className="text-gray-500 italic flex items-center justify-center space-x-2 py-8">
              <IoTerminalSharp className="w-6 h-6" />
              <span>Waiting for optimization to start...</span>
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-2 flex items-start space-x-2 animate-fade-in-up">
                <span className="text-yellow-400 font-bold text-xs mt-0.5">►</span>
                <span className="text-blue-300 text-xs">[{new Date().toLocaleTimeString()}]</span> 
                <span className="flex-1">{log}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Status Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl shadow-lg border border-blue-200/50 dark:border-blue-800/50 p-6 text-center hover-glow hover:scale-105 transition-all duration-300">
          <div className="text-3xl font-bold text-gradient">
            {schedulingCase.calendar.days.length}
          </div>
          <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mt-2">Calendar Days</div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl shadow-lg border border-green-200/50 dark:border-green-800/50 p-6 text-center hover-glow hover:scale-105 transition-all duration-300">
          <div className="text-3xl font-bold text-gradient">
            {schedulingCase.shifts.length}
          </div>
          <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mt-2 flex items-center justify-center space-x-2">
            <IoTimeSharp className="w-4 h-4" />
            <span>Total Shifts</span>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl shadow-lg border border-purple-200/50 dark:border-purple-800/50 p-6 text-center hover-glow hover:scale-105 transition-all duration-300">
          <div className="text-3xl font-bold text-gradient">
            {schedulingCase.providers.length}
          </div>
          <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mt-2">Providers</div>
        </div>
      </div>
    </div>
  );
}
