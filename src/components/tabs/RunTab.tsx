'use client';

import { useState } from 'react';
import { useScheduling } from '@/context/SchedulingContext';

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
      } catch {
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
    <div className="space-y-6">
      {/* Run Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Run Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Output Folder Name
            </label>
            <input
              type="text"
              value={schedulingCase.run.out}
              onChange={(e) => updateRunConfig('out', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              k (Solutions)
            </label>
            <input
              type="number"
              value={schedulingCase.run.k}
              onChange={(e) => updateRunConfig('k', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              L (Variety)
            </label>
            <input
              type="number"
              value={schedulingCase.run.L}
              onChange={(e) => updateRunConfig('L', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Seed
            </label>
            <input
              type="number"
              value={schedulingCase.run.seed}
              onChange={(e) => updateRunConfig('seed', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Time (minutes)
            </label>
            <input
              type="number"
              value={schedulingCase.run.time}
              onChange={(e) => updateRunConfig('time', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Run Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex space-x-4 mb-4">
          <button
            onClick={handleRunSolver}
            disabled={isRunning}
            className={`px-4 py-2 rounded-md font-medium ${
              isRunning
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isRunning ? 'Running...' : 'Run Solver'}
          </button>
          
          <button
            onClick={handleOpenOutputFolder}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Open Output Folder
          </button>
        </div>

        {/* Progress Bar */}
        {isRunning && (
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Log Output */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Log</h3>
        <div className="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-sm h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-500">No log entries yet...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span> {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Status Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {schedulingCase.calendar.days.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Calendar Days</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-green-600">
            {schedulingCase.shifts.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Shifts</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {schedulingCase.providers.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Providers</div>
        </div>
      </div>
    </div>
  );
}
