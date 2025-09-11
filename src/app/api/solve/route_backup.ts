import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, createAuthResponse } from '@/lib/auth';

interface SolverResult {
  status: string;
  message: string;
  run_id?: string;
  progress?: number;
  results?: unknown;
  websocket_url?: string;
  polling_url?: string;
  statistics?: Record<string, unknown>;
  error?: string;
}

// Configuration for solver services (priority order)
const SOLVER_ENDPOINTS = [
  // 1. Local development solver (when running locally)
  process.env.LOCAL_SOLVER_URL || 'http://localhost:8000',
  // 2. Production hosted solver (your server)
  process.env.PRODUCTION_SOLVER_URL || 'https://your-solver-service.com',
  // 3. Cloud function fallback (limited functionality)
  process.env.CLOUD_SOLVER_URL || null,
].filter(Boolean);

const SOLVER_TIMEOUT = 30000; // 30 seconds timeout for initial submission

async function trySolverEndpoint(endpoint: string, caseData: Record<string, unknown>): Promise<SolverResult> {
  console.log(`🔄 Trying solver endpoint: ${endpoint}`);
  
  const response = await fetch(`${endpoint}/solve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(caseData),
    signal: AbortSignal.timeout(SOLVER_TIMEOUT),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`${endpoint} failed: ${response.status} - ${errorData.detail || 'Unknown error'}`);
  }

  const result = await response.json();
  console.log(`✅ Success with endpoint: ${endpoint}`);
  return result;
}

export async function POST(request: NextRequest) {
  // Verify authentication
  const token = await verifyAuth(request);
  if (!token) {
    return createAuthResponse('Authentication required to access solver');
  }

  try {
    const caseData = await request.json();
    
    console.log('📤 Sending optimization request to FastAPI solver service...');
    console.log(`🔗 Solver URL: ${SOLVER_SERVICE_URL}/solve`);
    
    // Submit case to local FastAPI solver service
    const solverResponse = await fetch(`${SOLVER_SERVICE_URL}/solve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(caseData),
      signal: AbortSignal.timeout(SOLVER_TIMEOUT),
    });

    if (!solverResponse.ok) {
      const errorData = await solverResponse.json().catch(() => ({}));
      throw new Error(`Solver service error: ${solverResponse.status} - ${errorData.detail || 'Unknown error'}`);
    }

    const result = await solverResponse.json();
    console.log('✅ Solver service response received:', result.status);
    
    // Return the result from FastAPI solver
    const response = {
      status: result.status,
      message: result.message || 'Optimization request submitted',
      run_id: result.run_id,
      progress: result.progress || 0,
      solver_service_url: SOLVER_SERVICE_URL,
      websocket_url: `ws://localhost:8000/ws/${result.run_id}`,
      polling_url: `${SOLVER_SERVICE_URL}/status/${result.run_id}`,
      statistics: {
        totalShifts: caseData.shifts?.length || 0,
        totalProviders: caseData.providers?.length || 0,
        totalDays: caseData.calendar?.days?.length || 0,
        requestedSolutions: caseData.run?.k || 1,
        maxRuntime: caseData.constants?.solver?.max_time_in_seconds || 300,
      },
    };
    
    return NextResponse.json(response);
    
  } catch (error: unknown) {
    console.error('❌ Solver API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorName = error instanceof Error ? error.name : '';
    
    // Handle different error types
    if (errorName === 'TimeoutError' || errorMessage.includes('timeout')) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Solver service timeout - the optimization request took too long to submit. Please ensure the local solver service is running.',
          error: 'SERVICE_TIMEOUT',
          solver_service_url: SOLVER_SERVICE_URL
        },
        { status: 408 }
      );
    }
    
    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('fetch failed')) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Cannot connect to solver service. Please ensure the FastAPI solver service is running on your local machine.',
          error: 'SERVICE_UNAVAILABLE',
          solver_service_url: SOLVER_SERVICE_URL,
          instructions: {
            setup: 'Run: pip install fastapi uvicorn websockets python-multipart ortools',
            start: 'Run: python fastapi_solver_service.py',
            verify: `Check: ${SOLVER_SERVICE_URL}/health`
          }
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Failed to process scheduling request',
        error: errorMessage,
        solver_service_url: SOLVER_SERVICE_URL
      },
      { status: 500 }
    );
  }
}

// Add status polling endpoint
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const runId = searchParams.get('run_id');
  
  if (!runId) {
    return NextResponse.json({
      status: 'ok',
      message: 'Scheduling solver API is running',
      solver_service_url: SOLVER_SERVICE_URL,
      endpoints: {
        'POST /api/solve': 'Submit scheduling case for optimization',
        'GET /api/solve?run_id=<id>': 'Get optimization status',
      }
    });
  }
  
  try {
    // Proxy status request to FastAPI service
    const statusResponse = await fetch(`${SOLVER_SERVICE_URL}/status/${runId}`, {
      signal: AbortSignal.timeout(10000),
    });
    
    if (!statusResponse.ok) {
      throw new Error(`Status check failed: ${statusResponse.status}`);
    }
    
    const statusData = await statusResponse.json();
    return NextResponse.json(statusData);
    
  } catch (error) {
    console.error('❌ Status check error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Failed to check optimization status',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
