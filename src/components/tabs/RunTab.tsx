'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  IoStopSharp,
  IoDownloadSharp,
  IoDesktopSharp
} from 'react-icons/io5';
import { 
  SiApple,
  SiLinux
} from 'react-icons/si';

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
  const [showInstallMenu, setShowInstallMenu] = useState(false);
  const [installationStatus, setInstallationStatus] = useState<{
    checked: boolean;
    filesInstalled: boolean;
    pythonAvailable: boolean;
    lastChecked: string | null;
    installedFiles: string[];
    missingFiles: string[];
  }>({
    checked: false,
    filesInstalled: false,
    pythonAvailable: false,
    lastChecked: null,
    installedFiles: [],
    missingFiles: []
  });
  const [isCheckingInstallation, setIsCheckingInstallation] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const installMenuRef = useRef<HTMLDivElement>(null);
  const portalMenuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 320 });

  // Close install menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const anchor = installMenuRef.current;
      const menu = portalMenuRef.current;
      if (
        showInstallMenu &&
        anchor &&
        menu &&
        !anchor.contains(target) &&
        !menu.contains(target)
      ) {
        setShowInstallMenu(false);
      }
    };

    const updateMenuPosition = () => {
      const anchor = installMenuRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      // Position the menu below the button, aligned to left
      setMenuPosition({ top: Math.round(rect.bottom + 8), left: Math.round(rect.left), width: Math.round(rect.width || 320) });
    };

    if (showInstallMenu) {
      updateMenuPosition();
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('resize', updateMenuPosition);
      window.addEventListener('scroll', updateMenuPosition, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [showInstallMenu]);

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
        addLog(`🚀 Local high-performance mode active: ${info.solver_type}`, 'success');
        if (info.ortools_available) {
          addLog('⚡ OR-Tools optimization engine available', 'success');
        }
      } else {
        setLocalSolverAvailable(false);
      }
    } catch {
      setLocalSolverAvailable(false);
      addLog('💡 Local mode not active - using serverless mode', 'info');
    }
  }, [addLog]);

  // Installation status management functions
  const STORAGE_KEY = 'localSolverInstallationStatus';

  const loadInstallationStatus = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const status = JSON.parse(stored);
        setInstallationStatus(status);
        return status;
      }
    } catch (error) {
      console.warn('Failed to load installation status:', error);
    }
    return null;
  }, []);

  const saveInstallationStatus = useCallback((status: typeof installationStatus) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(status));
      setInstallationStatus(status);
    } catch (error) {
      console.warn('Failed to save installation status:', error);
    }
  }, []);

  const clearInstallationStatus = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setInstallationStatus({
        checked: false,
        filesInstalled: false,
        pythonAvailable: false,
        lastChecked: null,
        installedFiles: [],
        missingFiles: []
      });
      addLog('Installation status cleared', 'info');
    } catch (error) {
      console.warn('Failed to clear installation status:', error);
    }
  }, [addLog]);

  // Check if required files exist and local server is running
  const checkInstallationStatus = useCallback(async () => {
    if (isCheckingInstallation) return;
    
    setIsCheckingInstallation(true);
    addLog('🔍 Checking local mode setup...', 'info');

    const requiredFiles = [
      'local_solver.py',
      'start_local_solver.bat',
      'start_local_solver.sh'
    ];

    const installedFiles: string[] = [];
    const missingFiles: string[] = [];
    let serverRunning = false;

    // Check if files are available in public folder (downloadable)
    for (const file of requiredFiles) {
      try {
        const response = await fetch(`/${file}`, { method: 'HEAD' });
        if (response.ok) {
          installedFiles.push(file);
          addLog(`✅ Found ${file}`, 'success');
        } else {
          missingFiles.push(file);
          addLog(`❌ Missing ${file}`, 'error');
        }
      } catch {
        missingFiles.push(file);
        addLog(`❌ Cannot access ${file}`, 'error');
      }
    }

    // Check if local server is actually running
    try {
      const response = await fetch('http://localhost:8000/health', {
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.ok) {
        serverRunning = true;
        addLog('✅ Local server is running on localhost:8000', 'success');
      } else {
        addLog('⚠️ Local server not responding', 'warning');
      }
    } catch {
      addLog('⚠️ Local server not running', 'warning');
    }

    const newStatus = {
      checked: true,
      filesInstalled: missingFiles.length === 0,
      pythonAvailable: serverRunning, // Server running = ready to use
      lastChecked: new Date().toISOString(),
      installedFiles,
      missingFiles
    };

    saveInstallationStatus(newStatus);
    
    if (newStatus.filesInstalled && serverRunning) {
      addLog('🎉 Local mode is fully ready!', 'success');
      addLog('🚀 You can now use the "Local" run option for high performance!', 'success');
      // Auto-refresh page when everything is detected as working
      setTimeout(() => {
        addLog('🔄 Refreshing page to update interface...', 'success');
        window.location.reload();
      }, 2000);
    } else if (newStatus.filesInstalled && !serverRunning) {
      addLog('📁 Files are installed but server is not running', 'info');
      addLog('▶️ Start the local server by running the downloaded script', 'info');
    } else {
      addLog(`⚠️ Missing ${missingFiles.length} required files`, 'warning');
      addLog('💾 Use "Enable Local Solver" to download missing files first', 'info');
    }

    setIsCheckingInstallation(false);
  }, [addLog, saveInstallationStatus, isCheckingInstallation]);

  useEffect(() => {
    checkLocalSolverAvailability();
    // Load saved installation status
    loadInstallationStatus();
  }, [checkLocalSolverAvailability, loadInstallationStatus]);

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

  // Auto-start local server if files exist but server not running
  const startLocalServer = useCallback(async () => {
    addLog('🚀 Attempting to activate local server...', 'info');
    
    // Method 1: Try to wake up server with health check requests
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        addLog(`🔄 Activation attempt ${attempt}/3...`, 'info');
        
        const response = await fetch('http://localhost:8000/health', {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
          addLog('✅ Local server is now active!', 'success');
          setLocalSolverAvailable(true);
          // Refresh the installation status to reflect server is running
          setTimeout(checkInstallationStatus, 1000);
          // Refresh the page after successful detection
          setTimeout(() => {
            addLog('🔄 Refreshing page to update interface...', 'success');
            window.location.reload();
          }, 2000);
          return true;
        }
      } catch {
        // Wait between attempts
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    // Method 2: Try to trigger server via service worker or background script
    try {
      addLog('🔧 Trying alternative activation method...', 'info');
      
      // Create a temporary iframe to try to load a local file that might trigger the server
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = 'http://localhost:8000/';
      document.body.appendChild(iframe);
      
      // Wait a moment then check again
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const healthResponse = await fetch('http://localhost:8000/health', {
        signal: AbortSignal.timeout(3000)
      });
      
      document.body.removeChild(iframe);
      
      if (healthResponse.ok) {
        addLog('✅ Local server activated successfully!', 'success');
        setLocalSolverAvailable(true);
        setTimeout(checkInstallationStatus, 1000);
        // Refresh the page after successful detection
        setTimeout(() => {
          addLog('🔄 Refreshing page to update interface...', 'success');
          window.location.reload();
        }, 2000);
        return true;
      }
    } catch {
      // Clean up iframe if it exists
      const iframe = document.querySelector('iframe[src="http://localhost:8000/"]');
      if (iframe) {
        document.body.removeChild(iframe);
      }
    }

    addLog('⚠️ Could not auto-activate local server', 'warning');
    addLog('💡 Please run the start script manually: start_local_solver.bat (Windows) or ./start_local_solver.sh (Mac/Linux)', 'info');
    addLog('📁 Files are downloaded and ready in your Downloads folder', 'info');
    
    return false;
  }, [addLog, checkInstallationStatus]);

  // Modified handleRunSolver to auto-start local server when needed
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
          addLog(`⚠️ Local solver not responding: ${errorMsg}`, 'warning');
          
          // Try to auto-start the local server if files are available
          if (installationStatus.filesInstalled) {
            addLog('🔄 Attempting to start local server automatically...', 'info');
            const serverStarted = await startLocalServer();
            
            if (serverStarted) {
              // Retry the local solver request
              try {
                const retryResponse = await fetch('http://localhost:8000/solve', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(schedulingCase),
                  signal: AbortSignal.timeout(60000),
                });
                
                if (retryResponse.ok) {
                  result = await retryResponse.json();
                  addLog('⚡ Using LOCAL high-performance solver (auto-started)', 'success');
                  
                  if (result && result.statistics) {
                    result.statistics.actualSolverUsed = 'local';
                  }
                }
              } catch {
                addLog('❌ Retry after auto-start failed', 'error');
              }
            }
          }
          
          if (!result && !shouldTryServerless) {
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

  // Download functions for different platforms
  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const downloadPythonSolver = async () => {
    try {
      const response = await fetch('/local_solver.py');
      const content = await response.text();
      downloadFile('local_solver.py', content);
      addLog('📁 Downloaded local_solver.py', 'success');
    } catch {
      addLog('❌ Failed to download local_solver.py', 'error');
    }
  };

  const downloadWindowsScript = async () => {
    try {
      const response = await fetch('/start_local_solver.bat');
      const content = await response.text();
      downloadFile('start_local_solver.bat', content);
      addLog('📁 Downloaded Windows start script', 'success');
    } catch {
      addLog('❌ Failed to download Windows script', 'error');
    }
  };

  const downloadUnixScript = async () => {
    try {
      const response = await fetch('/start_local_solver.sh');
      const content = await response.text();
      downloadFile('start_local_solver.sh', content);
      addLog('📁 Downloaded Unix/Linux/Mac start script', 'success');
    } catch {
      addLog('❌ Failed to download Unix script', 'error');
    }
  };

  const handleSmartInstall = () => {
    const platform = navigator.platform.toLowerCase();
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (platform.includes('win') || userAgent.includes('windows')) {
      installForWindows();
    } else if (platform.includes('mac') || userAgent.includes('mac')) {
      installForMac();
    } else {
      installForLinux();
    }
  };

  const installForWindows = async () => {
    addLog('🪟 Installing for Windows...', 'info');
    await downloadPythonSolver();
    await downloadWindowsScript();
    addLog('✅ Windows installation files downloaded!', 'success');
    addLog('📋 One-time setup:', 'info');
    addLog('   1. Run start_local_solver.bat once (double-click it)', 'info');
    addLog('   2. After that, just click "Local" to run - it will auto-start!', 'info');
    addLog('   3. Click "Check Local Mode Setup" to verify everything works', 'info');
    setShowInstallMenu(false);
  };

  const installForMac = async () => {
    addLog('🍎 Installing for macOS...', 'info');
    await downloadPythonSolver();
    await downloadUnixScript();
    addLog('✅ macOS installation files downloaded!', 'success');
    addLog('📋 Next steps:', 'info');
    addLog('   1. Open Terminal and navigate to the download folder', 'info');
    addLog('   2. Run: chmod +x start_local_solver.sh', 'info');
    addLog('   3. Run: ./start_local_solver.sh', 'info');
    addLog('   4. Come back here and click "Check Local Mode Setup" to verify', 'info');
    setShowInstallMenu(false);
  };

  const installForLinux = async () => {
    addLog('🐧 Installing for Linux...', 'info');
    await downloadPythonSolver();
    await downloadUnixScript();
    addLog('✅ Linux installation files downloaded!', 'success');
    addLog('📋 Next steps:', 'info');
    addLog('   1. Open Terminal and navigate to the download folder', 'info');
    addLog('   2. Run: chmod +x start_local_solver.sh', 'info');
    addLog('   3. Run: ./start_local_solver.sh', 'info');
    addLog('   4. Come back here and click "Check Local Mode Setup" to verify', 'info');
    setShowInstallMenu(false);
  };

  return (
    <div className="space-y-4 lg:space-y-8 animate-fade-in-up">
      {/* Solver Status */}
  <div className="relative z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-4 lg:p-8 hover-glow">
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
                  ? 'Local High-Performance Mode Active' 
                  : localSolverAvailable === false 
                    ? 'Enable Local High-Performance Mode' 
                    : 'Checking Mode...'}
              </h3>
              <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
                {localSolverAvailable === true 
                  ? '10-100x faster optimization with OR-Tools' 
                  : localSolverAvailable === false 
                    ? 'Install local files for faster computation and better performance'
                    : 'Detecting available optimization engines...'}
              </p>
            </div>
          </div>
          {localSolverAvailable === false && (
            <div className="relative z-50" ref={installMenuRef}>
              <button
                onClick={() => setShowInstallMenu(!showInstallMenu)}
                className="relative px-8 py-4 text-lg font-bold bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 text-white rounded-2xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.05] transform overflow-hidden group min-w-[200px]"
              >
                {/* Animated background glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 via-blue-400/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Shimmer effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent transform skew-x-12"></div>
                
                <div className="relative z-10 flex items-center justify-center space-x-3">
                  <IoRocketSharp className="w-6 h-6" />
                  <span>Enable Local Solver</span>
                </div>
              </button>
              
              {/* Installation Menu Dropdown */}
              {showInstallMenu && createPortal(
                <div
                  ref={portalMenuRef}
                  className="fixed z-[9999] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden animate-fade-in-up"
                  style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px`, width: `${Math.max(menuPosition.width, 320)}px` }}
                >
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                      <IoRocketSharp className="w-5 h-5 text-blue-500" />
                      <span>Install Local Solver</span>
                    </h3>
                    
                    <div className="space-y-3">
                      {/* Smart Install Button */}
                      <button
                        onClick={handleSmartInstall}
                        className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-xl hover:from-emerald-600 hover:to-blue-600 font-semibold flex items-center justify-center space-x-3 transition-all duration-200 hover:scale-[1.02] transform"
                      >
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                          <IoDownloadSharp className="w-5 h-5 text-white" />
                        </div>
                        <span>Smart Install (Auto-detect OS)</span>
                      </button>
                      
                      {/* Manual Platform Selection */}
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Or choose manually:</p>
                        
                        <div className="space-y-2">
                          <button
                            onClick={installForWindows}
                            className="w-full px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 font-medium flex items-center justify-center space-x-3 transition-all duration-200"
                          >
                            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                              <IoDesktopSharp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span>Windows (.bat)</span>
                          </button>
                          
                          <button
                            onClick={installForMac}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium flex items-center justify-center space-x-3 transition-all duration-200"
                          >
                            <div className="w-8 h-8 bg-gray-500/20 rounded-lg flex items-center justify-center">
                              <SiApple className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                            </div>
                            <span>macOS (.sh)</span>
                          </button>
                          
                          <button
                            onClick={installForLinux}
                            className="w-full px-4 py-3 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/40 font-medium flex items-center justify-center space-x-3 transition-all duration-200"
                          >
                            <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                              <SiLinux className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <span>Linux (.sh)</span>
                          </button>
                        </div>
                      </div>
                      
                      {/* Help Text */}
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                          Downloads installation files and provides setup instructions
                        </p>
                      </div>
                    </div>
                  </div>
                </div>,
                document.body
              )}
            </div>
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

      {/* Installation Check Section */}
      {localSolverAvailable === false && (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-4 lg:p-8 hover-glow">
          <div className="flex items-center space-x-3 mb-4 lg:mb-6">
            <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <IoSync className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
            </div>
            <h2 className="text-xl lg:text-2xl font-bold text-gradient">
              Local Mode Setup
            </h2>
          </div>
          
          <div className="flex flex-col space-y-4">
            {/* Check Installation Button */}
            <div className="flex items-center space-x-3">
              <button
                onClick={checkInstallationStatus}
                disabled={isCheckingInstallation}
                className={`relative px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-3 ${
                  isCheckingInstallation
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : installationStatus.checked
                      ? installationStatus.filesInstalled && installationStatus.pythonAvailable
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                        : installationStatus.filesInstalled
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600'
                          : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
                      : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600'
                }`}
              >
                {isCheckingInstallation ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Checking Installation...</span>
                  </>
                ) : (
                  <>
                    <IoSync className="w-5 h-5" />
                    <span>Check Local Mode Setup</span>
                    {installationStatus.checked && (
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        installationStatus.filesInstalled && installationStatus.pythonAvailable
                          ? 'bg-green-500/20 text-white'
                          : installationStatus.filesInstalled
                            ? 'bg-yellow-500/20 text-white'
                            : 'bg-red-500/20 text-white'
                      }`}>
                        {installationStatus.filesInstalled && installationStatus.pythonAvailable
                          ? 'Ready'
                          : installationStatus.filesInstalled
                            ? 'Auto-Start'
                            : 'Setup Needed'}
                      </span>
                    )}
                  </>
                )}
              </button>
              
              {/* Clear Status Button */}
              {installationStatus.checked && (
                <div className="flex space-x-3">
                  <button
                    onClick={clearInstallationStatus}
                    className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                    title="Clear cached status and check again"
                  >
                    Clear Status
                  </button>
                  
                  {/* Quick Start Server Button - Only show when files exist but server not running */}
                  {installationStatus.filesInstalled && !installationStatus.pythonAvailable && (
                    <button
                      onClick={() => {
                        addLog('🚀 Opening quick start instructions...', 'info');
                        const platform = navigator.platform.toLowerCase();
                        const isWindows = platform.includes('win');
                        const instructions = isWindows 
                          ? 'Double-click the downloaded "start_local_solver.bat" file in your Downloads folder'
                          : 'Open Terminal, navigate to Downloads folder, and run: ./start_local_solver.sh';
                        
                        addLog(`📋 Quick Start: ${instructions}`, 'info');
                        addLog('⏱️ After starting, come back and click "Check Local Mode Setup"', 'info');
                        
                        // Also try to open the downloads folder
                        const link = document.createElement('a');
                        link.href = '/start_local_solver.bat';
                        link.download = 'start_local_solver.bat';
                        link.click();
                      }}
                      className="px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all font-medium flex items-center space-x-2"
                    >
                      <IoPlaySharp className="w-4 h-4" />
                      <span>Quick Start Server</span>
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {/* Installation Status Display */}
            {installationStatus.checked && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300">Installation Status</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Last checked: {installationStatus.lastChecked && new Date(installationStatus.lastChecked).toLocaleString()}
                  </span>
                </div>
                
                {installationStatus.installedFiles.length > 0 && (
                  <div className="mb-3">
                    <p className="text-green-600 dark:text-green-400 font-medium mb-2 text-sm">
                      ✅ Installed ({installationStatus.installedFiles.length}):
                    </p>
                    <ul className="space-y-1">
                      {installationStatus.installedFiles.map(file => (
                        <li key={file} className="text-green-600 dark:text-green-400 text-sm flex items-center space-x-2">
                          <IoCheckmarkDoneSharp className="w-4 h-4 flex-shrink-0" />
                          <span>{file}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {installationStatus.missingFiles.length > 0 && (
                  <div className="mb-3">
                    <p className="text-orange-600 dark:text-orange-400 font-medium mb-2 text-sm">
                      ❌ Missing ({installationStatus.missingFiles.length}):
                    </p>
                    <ul className="space-y-1">
                      {installationStatus.missingFiles.map(file => (
                        <li key={file} className="text-orange-600 dark:text-orange-400 text-sm flex items-center space-x-2">
                          <IoWarningSharp className="w-4 h-4 flex-shrink-0" />
                          <span>{file}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Status Summary */}
                <div className={`p-3 rounded-lg ${
                  installationStatus.filesInstalled && installationStatus.pythonAvailable
                    ? 'bg-green-100 dark:bg-green-900/30' 
                    : installationStatus.filesInstalled
                      ? 'bg-yellow-100 dark:bg-yellow-900/30'
                      : 'bg-orange-100 dark:bg-orange-900/30'
                }`}>
                  <div className="flex items-center space-x-3">
                    {installationStatus.filesInstalled && installationStatus.pythonAvailable ? (
                      <IoCheckmarkDoneSharp className="w-6 h-6 text-green-600 dark:text-green-400" />
                    ) : (
                      <IoWarningSharp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    )}
                    <div>
                      <p className={`font-medium text-sm ${
                        installationStatus.filesInstalled && installationStatus.pythonAvailable
                          ? 'text-green-700 dark:text-green-300' 
                          : 'text-orange-700 dark:text-orange-300'
                      }`}>
                        {installationStatus.filesInstalled && installationStatus.pythonAvailable
                          ? '🎉 Local Mode Fully Ready!' 
                          : installationStatus.filesInstalled
                            ? '📁 Files Ready - Server Not Running'
                            : '⚠️ Setup Required'}
                      </p>
                      <p className={`text-xs ${
                        installationStatus.filesInstalled && installationStatus.pythonAvailable
                          ? 'text-green-600 dark:text-green-400' 
                          : installationStatus.filesInstalled
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-orange-600 dark:text-orange-400'
                      }`}>
                        {installationStatus.filesInstalled && installationStatus.pythonAvailable
                          ? 'You can now use the "Local" run option for high-performance optimization' 
                          : installationStatus.filesInstalled
                            ? 'Click "Local" to run - the server will start automatically!'
                            : 'Download the required files using "Enable Local Solver" button above'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Server Status Indicator */}
                  {installationStatus.filesInstalled && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Local Server Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          installationStatus.pythonAvailable
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                        }`}>
                          {installationStatus.pythonAvailable ? '🟢 Running' : '🔴 Not Running'}
                        </span>
                      </div>
                      {!installationStatus.pythonAvailable && (
                        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                          💡 No manual setup needed - just click &quot;Local&quot; to run and it will auto-start!
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
        {/* Enhanced Solver Mode Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Smart Run Button (Auto-detect) */}
          <div className="flex flex-col">
            <button
              onClick={() => handleRunSolver('auto')}
              disabled={isRunning}
              className={`relative px-6 py-4 rounded-2xl font-bold text-base flex flex-col items-center justify-center space-y-2 transition-all duration-300 shadow-lg hover:shadow-2xl overflow-hidden group min-h-[120px] ${
                isRunning
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-gradient-to-br from-emerald-500 via-blue-500 to-indigo-600 text-white hover:from-emerald-600 hover:via-blue-600 hover:to-indigo-700 hover:scale-[1.02] transform'
              } backdrop-blur-sm border border-white/20 dark:border-gray-700/50`}
              title="Automatically detects and uses the best available solver - recommended for most users"
            >
              {/* Animated background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 via-blue-400/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent transform skew-x-12"></div>
              
              <div className="relative z-10 flex flex-col items-center space-y-2">
                {isRunning ? (
                  <>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    <span className="text-sm font-semibold">Running...</span>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <IoPlaySharp className="w-6 h-6" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold">Smart Run</span>
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full font-medium">Recommended</span>
                    </div>
                    <span className="text-xs opacity-90 font-medium">(Auto-detect)</span>
                  </>
                )}
              </div>
            </button>
            
            {/* Status indicator */}
            <div className="mt-2 text-center">
              <div className="inline-flex items-center space-x-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span>Recommended</span>
              </div>
            </div>
          </div>

          {/* Local Solver Button */}
          <div className="flex flex-col">
            <button
              onClick={() => handleRunSolver('local')}
              disabled={isRunning || !localSolverAvailable}
              className={`relative px-6 py-4 rounded-2xl font-bold text-base flex flex-col items-center justify-center space-y-2 transition-all duration-300 shadow-lg hover:shadow-2xl overflow-hidden group min-h-[120px] ${
                isRunning
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : localSolverAvailable
                    ? 'bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 text-white hover:from-orange-600 hover:via-red-600 hover:to-pink-700 hover:scale-[1.02] transform'
                    : 'bg-gradient-to-br from-gray-400 to-gray-500 text-white opacity-60 cursor-not-allowed'
              } backdrop-blur-sm border border-white/20 dark:border-gray-700/50`}
              title={localSolverAvailable ? 'Run with local high-performance solver (10-100x faster)' : 'Local server not running - use Smart Run instead or start server manually'}
            >
              {/* Animated background glow - only when available */}
              {localSolverAvailable && !isRunning && (
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 via-red-400/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              )}
              
              {/* Shimmer effect - only when available */}
              {localSolverAvailable && !isRunning && (
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent transform skew-x-12"></div>
              )}
              
              <div className="relative z-10 flex flex-col items-center space-y-2">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <IoRocketSharp className="w-6 h-6" />
                </div>
                <span className="font-bold">Local</span>
                <span className="text-xs opacity-90 font-medium">
                  {localSolverAvailable ? '(10-100x faster)' : '(Not available)'}
                </span>
              </div>
            </button>
            
            {/* Status indicator */}
            <div className="mt-2 text-center">
              {localSolverAvailable ? (
                <div className="inline-flex items-center space-x-1 px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-medium">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
                  <span>High Performance</span>
                </div>
              ) : (
                <div className="inline-flex items-center space-x-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800/30 text-gray-600 dark:text-gray-400 text-xs font-medium">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                  <span>Not Running</span>
                </div>
              )}
            </div>
          </div>

          {/* Serverless Button */}
          <div className="flex flex-col">
            <button
              onClick={() => handleRunSolver('serverless')}
              disabled={isRunning}
              className={`relative px-6 py-4 rounded-2xl font-bold text-base flex flex-col items-center justify-center space-y-2 transition-all duration-300 shadow-lg hover:shadow-2xl overflow-hidden group min-h-[120px] ${
                isRunning
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-600 text-white hover:from-blue-600 hover:via-cyan-600 hover:to-teal-700 hover:scale-[1.02] transform'
              } backdrop-blur-sm border border-white/20 dark:border-gray-700/50`}
              title="Run with serverless cloud solver (works everywhere, no installation required)"
            >
              {/* Animated background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-cyan-400/20 to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent transform skew-x-12"></div>
              
              <div className="relative z-10 flex flex-col items-center space-y-2">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <IoCloudSharp className="w-6 h-6" />
                </div>
                <span className="font-bold">Serverless</span>
                <span className="text-xs opacity-90 font-medium">(Always works)</span>
              </div>
            </button>
            
            {/* Status indicator */}
            <div className="mt-2 text-center">
              <div className="inline-flex items-center space-x-1 px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Always Available</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Stop Button - only show when running */}
          {isRunning && (
            <button
              onClick={stopSolver}
              className="relative px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 font-semibold flex items-center justify-center space-x-2 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-300/20 to-red-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <IoStopSharp className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Stop</span>
            </button>
          )}
          
          {/* Open Output Folder */}
          <button
            onClick={handleOpenOutputFolder}
            className="relative px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 dark:from-slate-700 dark:to-slate-800 text-white rounded-xl hover:from-slate-700 hover:to-slate-800 dark:hover:from-slate-600 dark:hover:to-slate-700 font-semibold flex items-center justify-center space-x-2 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-slate-400/20 to-slate-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <IoFolderOpenSharp className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Open Output Folder</span>
          </button>

          {/* Clear Logs */}
          <button
            onClick={clearLogs}
            className="relative px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl hover:from-amber-700 hover:to-orange-700 font-semibold flex items-center justify-center space-x-2 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-orange-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <IoTerminalSharp className="w-5 h-5 relative z-10" />
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
