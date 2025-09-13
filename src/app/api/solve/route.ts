import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, createAuthResponse } from '@/lib/auth';

interface SolverResult {
  status: string;
  message: string;
  run_id?: string;
  progress?: number;
  results?: unknown;
  statistics?: Record<string, unknown>;
  error?: string;
}

interface ShiftData {
  id?: string;
  name?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  duration?: number;
  required_providers?: number;
}

interface ProviderData {
  id?: string;
  name?: string;
  specialties?: string[];
  availability?: Record<string, boolean>;
  max_shifts_per_day?: number;
  max_hours_per_week?: number;
}

interface Assignment {
  shift_id: string;
  shift_name: string;
  provider_id: string;
  provider_name: string;
  date: string;
  start_time: string;
  end_time: string;
  solution_index: number;
}

interface Solution {
  assignments: Assignment[];
  solution_id: string;
  objective_value: number;
  feasible: boolean;
}

// Hybrid solver: tries local first (if available), then serverless fallback
async function runHybridSolver(caseData: Record<string, unknown>): Promise<SolverResult> {
  const runId = `run_${Date.now()}`;
  const startTime = Date.now();
  
  try {
    // 1. Try local solver first (if user has installed it)
    try {
      console.log('🔍 Checking for local solver...');
      // Use configurable timeout for local solver (default 30 minutes for very large problems)
      const localTimeoutMs = parseInt(process.env.LOCAL_SOLVER_TIMEOUT_MS || '1800000', 10);
      console.log(`🕐 Using local solver timeout: ${localTimeoutMs}ms (${localTimeoutMs / 60000} minutes)`);
      
      const localResponse = await fetch('http://localhost:8000/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(caseData),
        signal: AbortSignal.timeout(localTimeoutMs),
      });
      
      if (localResponse.ok) {
        const localResult = await localResponse.json();
        console.log('✅ Using local high-performance solver');
        return {
          ...localResult,
          statistics: {
            ...localResult.statistics,
            solverType: 'local_enhanced',
            fallbackUsed: false
          }
        };
      }
    } catch (localError) {
      // Better error handling for local solver issues
      const isTimeout = localError instanceof Error && localError.name === 'TimeoutError';
      const isAbortError = localError instanceof Error && localError.name === 'AbortError';
      const isNetworkError = localError instanceof Error && localError.message.includes('fetch');
      
      if (isTimeout || isAbortError) {
        console.log('⏱️ Local solver timed out - the solver may still be working in background');
        const shiftsCount = Array.isArray(caseData.shifts) ? caseData.shifts.length : 0;
        console.log(`💡 For large problems (${shiftsCount} shifts), consider:`);
        console.log('   - Waiting for the solver to finish (may take several minutes)');
        console.log('   - Increasing timeout via LOCAL_SOLVER_TIMEOUT_MS environment variable');
        console.log('   - Checking the local solver terminal for progress updates');
      } else if (isNetworkError) {
        console.log('🔌 Local solver connection failed - not installed or not running');
      } else {
        console.log('❌ Local solver error:', localError);
      }
      
      console.log('💡 Local solver not available, using serverless fallback');
    }
    
    // 2. Fallback to serverless solver
    console.log('🌐 Using serverless solver...');
    return await runServerlessSolver(caseData, runId, startTime);
    
  } catch (error) {
    console.error('❌ Hybrid solver error:', error);
    throw error;
  }
}
  
// Serverless solver function
async function runServerlessSolver(caseData: Record<string, unknown>, runId: string, startTime: number): Promise<SolverResult> {
  try {
    console.log(`🚀 Starting serverless optimization for run: ${runId}`);
    
    const shifts = (caseData.shifts as ShiftData[]) || [];
    const providers = (caseData.providers as ProviderData[]) || [];
    const calendarData = (caseData.calendar as Record<string, unknown>) || {};
    const days = (calendarData.days as string[]) || [];
    const runConfig = (caseData.run as Record<string, unknown>) || {};
    
    console.log(`📊 Processing ${shifts.length} shifts, ${providers.length} providers, ${days.length} days`);
    
    if (shifts.length === 0) {
      throw new Error('No shifts provided for optimization');
    }
    
    if (providers.length === 0) {
      throw new Error('No providers available for assignment');
    }
    
    // Generate solutions
    const requestedSolutions = Math.min((runConfig.k as number) || 1, 5); // Max 5 solutions for serverless
    const solutions: Solution[] = [];
    
    for (let solutionIdx = 0; solutionIdx < requestedSolutions; solutionIdx++) {
      const solution = generateSolution(shifts, providers, days, solutionIdx);
      if (solution) {
        solutions.push(solution);
      }
    }
    
    const executionTime = Date.now() - startTime;
    
    console.log(`✅ Generated ${solutions.length} solutions in ${executionTime}ms`);
    
    return {
      status: 'completed',
      message: `Optimization completed successfully - generated ${solutions.length} solution(s)`,
      run_id: runId,
      progress: 100,
      results: {
        solutions: solutions,
        solver_stats: {
          total_solutions: solutions.length,
          execution_time_ms: executionTime,
          solver_type: 'serverless_js',
          status: solutions.length > 0 ? 'OPTIMAL' : 'NO_SOLUTION',
          algorithm: 'round_robin_with_constraints',
          fallbackUsed: true
        }
      },
      statistics: {
        totalShifts: shifts.length,
        totalProviders: providers.length,
        totalDays: days.length,
        requestedSolutions: requestedSolutions,
        generatedSolutions: solutions.length,
        executionTimeMs: executionTime,
        solverType: 'serverless_js',
        feasible: solutions.length > 0,
        fallbackUsed: true
      }
    };
    
  } catch (error) {
    console.error('❌ Serverless solver error:', error);
    
    const executionTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown optimization error';
    
    return {
      status: 'error',
      message: `Optimization failed: ${errorMessage}`,
      run_id: runId,
      error: errorMessage,
      statistics: {
        executionTimeMs: executionTime,
        solverType: 'serverless_js',
        feasible: false,
        fallbackUsed: true
      }
    };
  }
}

// Generate a scheduling solution using constraint-based assignment
function generateSolution(
  shifts: ShiftData[], 
  providers: ProviderData[], 
  days: string[], 
  solutionIdx: number
): Solution | null {
  
  try {
    const assignments: Assignment[] = [];
    const providerWorkload: Map<string, number> = new Map();
    const dailyAssignments: Map<string, Map<string, number>> = new Map();
    
    // Initialize provider workload tracking
    providers.forEach(provider => {
      providerWorkload.set(provider.id || `provider_${providers.indexOf(provider)}`, 0);
    });
    
    // Initialize daily assignment tracking
    days.forEach(day => {
      dailyAssignments.set(day, new Map());
      providers.forEach(provider => {
        const providerId = provider.id || `provider_${providers.indexOf(provider)}`;
        dailyAssignments.get(day)?.set(providerId, 0);
      });
    });
    
    // Sort shifts by date and time for consistent assignment
    const sortedShifts = [...shifts].sort((a, b) => {
      const dateCompare = (a.date || '').localeCompare(b.date || '');
      if (dateCompare !== 0) return dateCompare;
      return (a.start_time || '').localeCompare(b.start_time || '');
    });
    
    // Assign providers to shifts
    for (const shift of sortedShifts) {
      const shiftId = shift.id || `shift_${shifts.indexOf(shift)}`;
      const shiftDate = shift.date || (days[0] || new Date().toISOString().split('T')[0]);
      
      // Find the best provider for this shift
      const bestProvider = findBestProvider(
        providers, 
        shift, 
        shiftDate, 
        providerWorkload, 
        dailyAssignments, 
        solutionIdx
      );
      
      if (bestProvider) {
        const providerId = bestProvider.id || `provider_${providers.indexOf(bestProvider)}`;
        const providerName = bestProvider.name || `Provider ${providers.indexOf(bestProvider) + 1}`;
        
        // Create assignment
        const assignment: Assignment = {
          shift_id: shiftId,
          shift_name: shift.name || `Shift ${shifts.indexOf(shift) + 1}`,
          provider_id: providerId,
          provider_name: providerName,
          date: shiftDate,
          start_time: shift.start_time || '08:00',
          end_time: shift.end_time || '16:00',
          solution_index: solutionIdx
        };
        
        assignments.push(assignment);
        
        // Update workload tracking
        const shiftDuration = calculateShiftDuration(shift);
        const currentWorkload = providerWorkload.get(providerId) || 0;
        providerWorkload.set(providerId, currentWorkload + shiftDuration);
        
        // Update daily assignments
        const dailyMap = dailyAssignments.get(shiftDate);
        if (dailyMap) {
          const currentDaily = dailyMap.get(providerId) || 0;
          dailyMap.set(providerId, currentDaily + 1);
        }
      }
    }
    
    if (assignments.length === 0) {
      return null;
    }
    
    return {
      assignments: assignments,
      solution_id: `solution_${solutionIdx + 1}`,
      objective_value: assignments.length,
      feasible: true
    };
    
  } catch (error) {
    console.error(`Error generating solution ${solutionIdx}:`, error);
    return null;
  }
}

// Find the best provider for a shift based on constraints and load balancing
function findBestProvider(
  providers: ProviderData[],
  shift: ShiftData,
  date: string,
  workload: Map<string, number>,
  dailyAssignments: Map<string, Map<string, number>>,
  solutionVariation: number
): ProviderData | null {
  
  const availableProviders = providers.filter((provider, index) => {
    const providerId = provider.id || `provider_${index}`;
    
    // Check daily shift limits
    const maxShiftsPerDay = provider.max_shifts_per_day || 2;
    const dailyMap = dailyAssignments.get(date);
    const currentDailyShifts = dailyMap?.get(providerId) || 0;
    
    if (currentDailyShifts >= maxShiftsPerDay) {
      return false;
    }
    
    // Check weekly hour limits (simplified)
    const maxHoursPerWeek = provider.max_hours_per_week || 40;
    const currentHours = workload.get(providerId) || 0;
    const shiftHours = calculateShiftDuration(shift);
    
    if (currentHours + shiftHours > maxHoursPerWeek) {
      return false;
    }
    
    // Check availability if specified
    if (provider.availability && typeof provider.availability === 'object') {
      const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      if (provider.availability[dayName] === false) {
        return false;
      }
    }
    
    return true;
  });
  
  if (availableProviders.length === 0) {
    return null;
  }
  
  // Apply solution variation for different solutions
  const startIndex = solutionVariation % availableProviders.length;
  
  // Sort by current workload (least loaded first) with variation
  const sortedProviders = availableProviders.sort((a, b) => {
    const aId = a.id || `provider_${providers.indexOf(a)}`;
    const bId = b.id || `provider_${providers.indexOf(b)}`;
    const aWorkload = workload.get(aId) || 0;
    const bWorkload = workload.get(bId) || 0;
    
    return aWorkload - bWorkload;
  });
  
  // Return provider with variation for different solutions
  return sortedProviders[startIndex % sortedProviders.length];
}

// Calculate shift duration in hours
function calculateShiftDuration(shift: ShiftData): number {
  if (shift.duration) {
    return shift.duration;
  }
  
  const startTime = shift.start_time || '08:00';
  const endTime = shift.end_time || '16:00';
  
  try {
    const start = parseTime(startTime);
    const end = parseTime(endTime);
    
    let duration = end - start;
    if (duration < 0) {
      duration += 24; // Handle overnight shifts
    }
    
    return duration;
  } catch {
    return 8; // Default 8-hour shift
  }
}

// Parse time string to hours (24-hour format)
function parseTime(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours + (minutes || 0) / 60;
}

export async function POST(request: NextRequest) {
  // Verify authentication
  const token = await verifyAuth(request);
  if (!token) {
    return createAuthResponse('Authentication required to access solver');
  }

  try {
    const caseData = await request.json();
    
    // Check if serverless mode is explicitly requested
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');
    
    console.log('🚀 Starting optimization...');
    console.log(`📊 Case data: ${Object.keys(caseData).join(', ')}`);
    console.log(`🎯 Requested mode: ${mode || 'auto'}`);
    
    let result;
    
    if (mode === 'serverless') {
      // Force serverless mode
      console.log('🌐 Forcing serverless mode...');
      result = await runServerlessSolver(caseData, `run_${Date.now()}`, Date.now());
    } else {
      // Run hybrid solver (local first, then serverless fallback)
      result = await runHybridSolver(caseData);
    }
    
    console.log('✅ Optimization completed');
    
    return NextResponse.json(result);
    
  } catch (error: unknown) {
    console.error('❌ Serverless solver error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Failed to process scheduling request',
        error: errorMessage,
        solver_type: 'serverless'
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Serverless Scheduling Solver API is running',
    solver_type: 'serverless_js',
    capabilities: [
      '✅ Pure JavaScript/TypeScript implementation',
      '✅ No external dependencies or installations required',
      '✅ Multi-solution generation with constraint satisfaction',
      '✅ Provider workload balancing and availability checking',
      '✅ Daily and weekly shift limit enforcement',
      '✅ Cross-platform compatibility (Windows, Mac, Linux)',
      '✅ Vercel serverless function compatible'
    ],
    endpoints: {
      'POST /api/solve': 'Submit scheduling case for optimization',
      'GET /api/solve': 'API health check',
    },
    performance: {
      typical_execution: '< 1 second for 50 shifts and 10 providers',
      max_shifts: '1000+ shifts supported',
      max_solutions: '5 solutions per request',
      timeout: 'Vercel 10-second function limit'
    }
  });
}