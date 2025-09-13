import { NextRequest, NextResponse } from 'next/server';

interface SchedulingData {
  id: string;
  data: unknown;
  timestamp: string;
  expiresAt: string;
}

// In-memory storage for demo (in production, use Vercel KV, PostgreSQL, or MongoDB)
const dataStore = new Map<string, SchedulingData>();

// Cleanup expired data
function cleanup() {
  const now = new Date().getTime();
  for (const [key, value] of dataStore.entries()) {
    if (new Date(value.expiresAt).getTime() < now) {
      dataStore.delete(key);
    }
  }
}

export async function GET(request: NextRequest) {
  cleanup();
  
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
  }
  
  const data = dataStore.get(id);
  if (!data) {
    return NextResponse.json({ error: 'Data not found or expired' }, { status: 404 });
  }
  
  return NextResponse.json({
    success: true,
    data: data.data,
    timestamp: data.timestamp
  });
}

export async function POST(request: NextRequest) {
  cleanup();
  
  try {
    const body = await request.json();
    const { id, data } = body;
    
    if (!id || !data) {
      return NextResponse.json({ error: 'Missing required fields: id, data' }, { status: 400 });
    }
    
    // Data expires in 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    
    dataStore.set(id, {
      id,
      data,
      timestamp: new Date().toISOString(),
      expiresAt
    });
    
    return NextResponse.json({
      success: true,
      message: 'Data saved successfully',
      expiresAt
    });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON data' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
  }
  
  const deleted = dataStore.delete(id);
  
  return NextResponse.json({
    success: true,
    deleted,
    message: deleted ? 'Data deleted successfully' : 'Data not found'
  });
}