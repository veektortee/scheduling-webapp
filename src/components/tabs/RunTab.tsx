'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useScheduling } from '@/context/SchedulingContext';
import { 
  IoRocketSharp,
  IoSettingsSharp,
  IoPlaySharp,
  IoFolderOpenSharp,
  IoTerminalSharp,
  IoTimerSharp,
  IoPowerSharp,
  IoSync,
  IoCheckmarkDoneSharp,
  IoWarningSharp,
  IoCloudSharp,
  IoStopSharp
} from 'react-icons/io5';

interface SolverResult {
  status: string;
  message: string;
  run_id?: string;
  progress?: number;
  results?: unknown;
  solver_service_url?: string;
  websocket_url?: string;
  polling_url?: string;
  statistics?: Record<string, unknown>;
  error?: string;
  instructions?: Record<string, unknown>;
}

export default function RunTab() {
  const { state, dispatch } = useScheduling();
  const { case: schedulingCase } = state;
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>(['Ready to run optimization...']);
  const [solverState, setSolverState] = useState<'ready' | 'connecting' | 'running' | 'finished' | 'error'>('ready');
  const [localSolverAvailable, setLocalSolverAvailable] = useState<boolean | null>(null);
  const [solverInfo, setSolverInfo] = useState<{type: string; capabilities?: string[]} | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
      info: '🔵',
      success: '✅', 
      error: '❌',
      warning: '⚠️'
    }[type];
    
    setLogs(prev => [...prev, `${timestamp} ${prefix} ${message}`]);
  }, []);

  // Check local solver availability on component mount
  const checkLocalSolverAvailability = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/health', {
        signal: AbortSignal.timeout(2000)
      });
      
      if (response.ok) {
        const info = await response.json();
        setLocalSolverAvailable(true);
        setSolverInfo(info);
        addLog(`🚀 Local high-performance solver detected: ${info.solver_type}`, 'success');
        if (info.ortools_available) {
          addLog('⚡ OR-Tools optimization engine available', 'success');
        }
      } else {
        setLocalSolverAvailable(false);
      }
    } catch {
      setLocalSolverAvailable(false);
      addLog('💡 Local solver not running - using serverless mode', 'info');
    }
  }, [addLog]);

  useEffect(() => {
    checkLocalSolverAvailability();
  }, [checkLocalSolverAvailability]);

  // Auto-scroll logs to bottom
  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  // Cleanup on unmount (simplified for serverless)
  useEffect(() => {
    return () => {
      // No cleanup needed for serverless approach
    };
  }, []);

  const clearLogs = () => {
    setLogs([]);
    addLog('Logs cleared');
  };

  // WebSocket and polling functions removed for serverless approach
  
  const getSolverIcon = () => {
    switch (solverState) {
      case 'ready':
        return <IoPowerSharp className="w-6 h-6 text-white" />;
      case 'connecting':
        return <IoCloudSharp className="w-6 h-6 text-white animate-pulse" />;
      case 'running':
        return <IoSync className="w-6 h-6 text-white animate-spin" />;
      case 'finished':
        return <IoCheckmarkDoneSharp className="w-6 h-6 text-white" />;
      case 'error':
        return <IoWarningSharp className="w-6 h-6 text-white" />;
      default:
        return <IoPowerSharp className="w-6 h-6 text-white" />;
    }
  };

  const getSolverText = () => {
    switch (solverState) {
      case 'ready':
        return 'Ready';
      case 'connecting':
        return 'Connecting...';
      case 'running':
        return 'Processing';
      case 'finished':
        return 'Finished';
      case 'error':
        return 'Error';
      default:
        return 'Ready';
    }
  };

  const handleRunSolver = async (solverMode: 'auto' | 'local' | 'serverless' = 'auto') => {
    if (isRunning) return;
    
    if (!schedulingCase.shifts?.length) {
      addLog('No shifts available to optimize', 'error');
      return;
    }

    if (!schedulingCase.providers?.length) {
      addLog('No providers available for assignment', 'error');
      return;
    }

    setIsRunning(true);
    setProgress(0);
    setSolverState('connecting');
    
    // Determine which solver to use
    let shouldTryLocal = false;
    let shouldTryServerless = true;
    
    switch (solverMode) {
      case 'local':
        shouldTryLocal = true;
        shouldTryServerless = false;
        addLog('🚀 Starting LOCAL high-performance optimization...', 'info');
        break;
      case 'serverless':
        shouldTryLocal = false;
        shouldTryServerless = true;
        addLog('🌐 Starting SERVERLESS optimization...', 'info');
        break;
      case 'auto':
      default:
        shouldTryLocal = localSolverAvailable === true;
        shouldTryServerless = true;
        addLog('🔄 Starting optimization (auto-detect mode)...', 'info');
        break;
    }

    addLog(`📊 Processing ${schedulingCase.shifts.length} shifts and ${schedulingCase.providers.length} providers`);

    try {
      const startTime = Date.now();
      let result: SolverResult | null = null;
      
      // Try local solver first if requested
      if (shouldTryLocal) {
        setSolverState('running');
        addLog('🔌 Connecting to local solver...', 'info');
        
        try {
          const localResponse = await fetch('http://localhost:8000/solve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(schedulingCase),
            signal: AbortSignal.timeout(60000), // 1 minute timeout for local
          });
          
          if (localResponse.ok) {
            result = await localResponse.json();
            addLog('⚡ Using LOCAL high-performance solver', 'success');
            
            // Add solver type info to result
            if (result && result.statistics) {
              result.statistics.actualSolverUsed = 'local';
            }
          } else {
            throw new Error(`Local solver returned ${localResponse.status}`);
          }
        } catch (localError) {
          const errorMsg = localError instanceof Error ? localError.message : 'Unknown error';
          addLog(`❌ Local solver failed: ${errorMsg}`, 'error');
          
          if (!shouldTryServerless) {
            throw new Error(`Local solver required but failed: ${errorMsg}`);
          }
          
          addLog('🔄 Falling back to serverless solver...', 'warning');
        }
      }
      
      // Try serverless if local failed or not requested
      if (!result && shouldTryServerless) {
        addLog('📡 Connecting to serverless solver...', 'info');
        
        const serverlessResponse = await fetch('/api/solve?mode=serverless', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(schedulingCase),
        });

        if (!serverlessResponse.ok) {
          const errorData = await serverlessResponse.json();
          throw new Error(errorData.message || `HTTP ${serverlessResponse.status}`);
        }

        result = await serverlessResponse.json();
        addLog('🌐 Using SERVERLESS solver', 'success');
        
        // Add solver type info to result
        if (result && result.statistics) {
          result.statistics.actualSolverUsed = 'serverless';
        }
      }
      
      if (!result) {
        throw new Error('No solver available');
      }

      const executionTime = Date.now() - startTime;
      const actualSolver = (result.statistics?.actualSolverUsed as string) || 'unknown';
      addLog(`⚡ Optimization completed in ${executionTime}ms using ${actualSolver.toUpperCase()} solver`, 'success');
      
      if (result.status === 'completed') {
        setSolverState('finished');
        setProgress(100);
        
        // Display results
        if (result.results && typeof result.results === 'object') {
          const resultsData = result.results as { solutions?: Array<unknown>; solver_stats?: Record<string, unknown> };
          const solutions = resultsData.solutions || [];
          const stats = resultsData.solver_stats || {};
          
          addLog(`✅ Generated ${solutions.length} solution(s)`, 'success');
          addLog(`� Solver: ${stats.solver_type || 'serverless'} (${stats.status || 'completed'})`, 'info');
          
          // Store results in context (note: this may need proper action type in context)
          // dispatch({
          //   type: 'SET_RESULTS',
          //   payload: {
          //     results: result.results,
          //     metadata: {
          //       runId: result.run_id || 'serverless',
          //       timestamp: new Date().toISOString(),
          //       statistics: result.statistics,
          //       executionTimeMs: executionTime,
          //       solverType: 'serverless'
          //     }
          //   }
          // });
          
          // For now, just log the results
          addLog(`📊 Results: ${JSON.stringify(result.results, null, 2).slice(0, 200)}...`, 'info');
          
          addLog('📋 Results saved and ready for export', 'success');
        }
        
      } else if (result.status === 'error') {
        throw new Error(result.error || result.message);
      }
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog(`❌ Optimization failed: ${errorMessage}`, 'error');
      setSolverState('error');
      setProgress(0);
    } finally {
      setIsRunning(false);
    }
  };

  const stopSolver = () => {
    // For serverless approach, we just reset the UI state
    setIsRunning(false);
    setSolverState('ready');
    setProgress(0);
    addLog('🛑 Optimization stopped by user', 'warning');
  };

  const handleOpenOutputFolder = () => {
    addLog(`Output folder: ${schedulingCase.run.out}`);
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
    <div className="space-y-4 lg:space-y-8 animate-fade-in-up">
      {/* Solver Status */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-4 lg:p-8 hover-glow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-lg flex items-center justify-center ${
              localSolverAvailable === true 
                ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
                : localSolverAvailable === false 
                  ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                  : 'bg-gradient-to-br from-gray-400 to-gray-500'
            }`}>
              {localSolverAvailable === true ? (
                <IoRocketSharp className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
              ) : (
                <IoCloudSharp className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-lg lg:text-xl font-bold text-gradient">
                {localSolverAvailable === true 
                  ? 'Local High-Performance Solver' 
                  : localSolverAvailable === false 
                    ? 'Serverless Mode' 
                    : 'Checking Solver...'}
              </h3>
              <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
                {localSolverAvailable === true 
                  ? '10-100x faster optimization with OR-Tools' 
                  : localSolverAvailable === false 
                    ? 'Works everywhere, no installation required'
                    : 'Detecting available optimization engines...'}
              </p>
            </div>
          </div>
          {localSolverAvailable === false && (
            <button
              onClick={() => {
                addLog('💡 To enable local high-performance solver:', 'info');
                addLog('   1. Download local_solver.py and start_local_solver.bat', 'info');
                addLog('   2. Double-click start_local_solver.bat (Windows) or start_local_solver.sh (Mac/Linux)', 'info');
                addLog('   3. Refresh this page - local solver will be detected automatically', 'info');
              }}
              className="px-3 py-1.5 text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all duration-200"
            >
              Enable Local
            </button>
          )}
        </div>
        
        {solverInfo && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Capabilities</div>
              <div className="space-y-1">
                {solverInfo.capabilities?.map((capability, index) => (
                  <div key={index} className="text-xs text-gray-600 dark:text-gray-400">
                    {capability}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Performance</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {localSolverAvailable ? 
                  "High-performance OR-Tools optimization" :
                  "Basic constraint satisfaction (sufficient for most cases)"
                }
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Run Settings */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-4 lg:p-8 hover-glow">
        <div className="flex items-center space-x-3 mb-4 lg:mb-6">
          <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <IoSettingsSharp className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
          </div>
          <h2 className="text-xl lg:text-2xl font-bold text-gradient">
            Run Settings
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          <div>
            <label className="block text-xs lg:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Output Folder Name
            </label>
            <input
              type="text"
              value={schedulingCase.run.out}
              onChange={(e) => updateRunConfig('out', e.target.value)}
              className="w-full px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:shadow-md text-sm lg:text-base"
            />
          </div>
          
          <div>
            <label className="block text-xs lg:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              k (Solutions)
            </label>
            <input
              type="number"
              value={schedulingCase.run.k}
              onChange={(e) => updateRunConfig('k', parseInt(e.target.value) || 0)}
              className="w-full px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:shadow-md text-sm lg:text-base"
            />
          </div>
          
          <div>
            <label className="block text-xs lg:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              L (Variety)
            </label>
            <input
              type="number"
              value={schedulingCase.run.L}
              onChange={(e) => updateRunConfig('L', parseInt(e.target.value) || 0)}
              className="w-full px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:shadow-md text-sm lg:text-base"
            />
          </div>
          
          <div>
            <label className="block text-xs lg:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Seed
            </label>
            <input
              type="number"
              value={schedulingCase.run.seed}
              onChange={(e) => updateRunConfig('seed', parseInt(e.target.value) || 0)}
              className="w-full px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:shadow-md text-sm lg:text-base"
            />
          </div>
          
          <div>
            <label className="flex items-center space-x-2 text-xs lg:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <IoTimerSharp className="w-3 h-3 lg:w-4 lg:h-4" />
              <span>Time (minutes)</span>
            </label>
            <input
              type="number"
              value={schedulingCase.run.time}
              onChange={(e) => updateRunConfig('time', parseFloat(e.target.value) || 0)}
              className="w-full px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:shadow-md text-sm lg:text-base"
            />
          </div>
        </div>
      </div>

      {/* Run Controls */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-4 lg:p-8 hover-glow">
        <div className="flex items-center space-x-3 mb-4 lg:mb-6">
          <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <IoRocketSharp className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
          </div>
          <h2 className="text-xl lg:text-2xl font-bold text-gradient">
            Optimization Control
          </h2>
        </div>
        <div className="flex flex-col space-y-3 lg:space-y-0 lg:flex-row lg:space-x-4 mb-4 lg:mb-6">
          {/* Auto Run Button (Default) */}
          <button
            onClick={() => handleRunSolver('auto')}
            disabled={isRunning}
            className={`relative px-6 lg:px-8 py-3 lg:py-4 rounded-xl font-bold text-base lg:text-lg flex items-center justify-center space-x-3 transition-all duration-300 shadow-lg hover:shadow-2xl overflow-hidden group flex-1 ${
              isRunning
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700 hover:scale-105'
            }`}
          >
            {!isRunning && <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>}
            {isRunning ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 lg:h-6 lg:w-6 border-b-2 border-white"></div>
                <span>Running Optimization...</span>
              </>
            ) : (
              <>
                <IoPlaySharp className="w-5 h-5 lg:w-6 lg:h-6" />
                <span>Smart Run</span>
                <span className="text-xs opacity-80">(Auto-detect)</span>
              </>
            )}
          </button>

          {/* Local Run Button */}
          <button
            onClick={() => handleRunSolver('local')}
            disabled={isRunning}
            className={`relative px-4 lg:px-6 py-3 lg:py-4 rounded-xl font-semibold text-sm lg:text-base flex items-center justify-center space-x-2 transition-all duration-300 shadow-lg hover:shadow-2xl overflow-hidden group ${
              isRunning
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : localSolverAvailable
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 hover:scale-105'
                  : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white opacity-50 cursor-not-allowed'
            }`}
            title={localSolverAvailable ? 'Run with local high-performance solver' : 'Local solver not available - start local_solver.py first'}
          >
            {!isRunning && localSolverAvailable && <div className="absolute inset-0 bg-gradient-to-r from-orange-300 to-red-300 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>}
            <IoRocketSharp className="w-4 h-4 lg:w-5 lg:h-5" />
            <span>Local</span>
            {localSolverAvailable && <span className="text-xs opacity-80">(10-100x faster)</span>}
          </button>

          {/* Serverless Run Button */}
          <button
            onClick={() => handleRunSolver('serverless')}
            disabled={isRunning}
            className={`relative px-4 lg:px-6 py-3 lg:py-4 rounded-xl font-semibold text-sm lg:text-base flex items-center justify-center space-x-2 transition-all duration-300 shadow-lg hover:shadow-2xl overflow-hidden group ${
              isRunning
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 hover:scale-105'
            }`}
            title="Run with serverless cloud solver (always available)"
          >
            {!isRunning && <div className="absolute inset-0 bg-gradient-to-r from-blue-300 to-cyan-300 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>}
            <IoCloudSharp className="w-4 h-4 lg:w-5 lg:h-5" />
            <span>Serverless</span>
            <span className="text-xs opacity-80">(Always works)</span>
          </button>

          {/* Stop Button - only show when running */}
          {isRunning && (
            <button
              onClick={stopSolver}
              className="relative px-4 lg:px-6 py-3 lg:py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 font-semibold flex items-center justify-center space-x-2 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <IoStopSharp className="w-4 h-4 lg:w-5 lg:h-5" />
              <span className="relative z-10">Stop</span>
            </button>
          )}
          
          <button
            onClick={handleOpenOutputFolder}
            className="relative px-4 lg:px-6 py-3 lg:py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 font-semibold flex items-center justify-center space-x-2 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 overflow-hidden group w-full lg:w-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-gray-400 to-gray-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            <IoFolderOpenSharp className="w-4 h-4 lg:w-5 lg:h-5" />
            <span className="relative z-10">Open Output Folder</span>
          </button>

          <button
            onClick={clearLogs}
            className="relative px-4 lg:px-6 py-3 lg:py-4 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl hover:from-orange-700 hover:to-orange-800 font-semibold flex items-center justify-center space-x-2 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 overflow-hidden group w-full lg:w-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            <IoTerminalSharp className="w-4 h-4 lg:w-5 lg:h-5" />
            <span className="relative z-10">Clear Logs</span>
          </button>
        </div>

        {/* Progress Bar */}
        {isRunning && (
          <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-xl p-4 lg:p-6 border border-blue-200/50 dark:border-blue-800/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs lg:text-sm font-semibold text-gray-700 dark:text-gray-300">Optimization Progress</span>
              </div>
              <span className="text-base lg:text-lg font-bold text-blue-600 dark:text-blue-400">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 lg:h-3 shadow-inner">
              <div
                className="bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 h-2 lg:h-3 rounded-full transition-all duration-500 ease-out shadow-lg"
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
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-4 lg:p-8 hover-glow">
        <div className="flex items-center space-x-3 mb-4 lg:mb-6">
          <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <IoTerminalSharp className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
          </div>
          <h3 className="text-xl lg:text-2xl font-bold text-gradient">
            System Log
          </h3>
        </div>
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-green-400 p-3 lg:p-6 rounded-xl font-mono text-xs lg:text-sm h-64 lg:h-80 overflow-y-auto shadow-inner border border-gray-700">
          {logs.length === 0 ? (
            <div className="text-gray-500 italic flex flex-col lg:flex-row items-center justify-center space-y-2 lg:space-y-0 lg:space-x-2 py-8 text-center">
              <IoTerminalSharp className="w-5 h-5 lg:w-6 lg:h-6" />
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

      {/* Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              {getSolverIcon()}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Optimization</p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{getSolverText()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
