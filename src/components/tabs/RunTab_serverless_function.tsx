  const handleRunSolver = async () => {
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
    
    addLog('🚀 Starting serverless optimization...');
    addLog(`📊 Processing ${schedulingCase.shifts.length} shifts and ${schedulingCase.providers.length} providers`);

    try {
      const startTime = Date.now();
      
      // Submit case to serverless solver
      addLog('📡 Submitting to serverless solver...');
      setSolverState('running');
      
      const response = await fetch('/api/solve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(schedulingCase),
      });

      const result: SolverResult = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}`);
      }

      const executionTime = Date.now() - startTime;
      addLog(`⚡ Optimization completed in ${executionTime}ms`, 'success');
      
      if (result.status === 'completed') {
        setSolverState('finished');
        setProgress(100);
        
        // Display results
        if (result.results && typeof result.results === 'object') {
          const resultsData = result.results as { solutions?: Array<unknown>; solver_stats?: Record<string, unknown> };
          const solutions = resultsData.solutions || [];
          const stats = resultsData.solver_stats || {};
          
          addLog(`✅ Generated ${solutions.length} solution(s)`, 'success');
          addLog(`📈 Solver: ${stats.solver_type || 'serverless'} (${stats.status || 'completed'})`, 'info');
          
          // Store results in context
          dispatch({
            type: 'SET_RESULTS',
            payload: {
              results: result.results,
              metadata: {
                runId: result.run_id || 'serverless',
                timestamp: new Date().toISOString(),
                statistics: result.statistics,
                executionTimeMs: executionTime,
                solverType: 'serverless'
              }
            }
          });
          
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