import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const runId = searchParams.get('runId');
  
  if (!runId) {
    return NextResponse.json({ error: 'Run ID is required' }, { status: 400 });
  }
  
  try {
    // Try to fetch from local solver service
    const localResponse = await fetch(`http://localhost:8000/output/${runId}`);
    
    if (localResponse.ok) {
      const data = await localResponse.json();
      return NextResponse.json(data);
    } else {
      return NextResponse.json({
        error: 'Run not found or local solver not available',
        message: 'The local solver service is not running or the run ID does not exist.'
      }, { status: 404 });
    }
    
  } catch (error) {
    console.error('Error fetching output:', error);
    return NextResponse.json({
      error: 'Failed to fetch output',
      message: 'Could not connect to the local solver service. Make sure it is running on port 8000.'
    }, { status: 500 });
  }
}