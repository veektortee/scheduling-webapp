import { NextRequest, NextResponse } from 'next/server';

// Credential recovery via email has been removed from this application.
// This endpoint now returns 410 Gone for all requests to make the removal explicit.

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'Credential recovery via email has been disabled and removed from this application.'
    },
    { status: 410 }
  );
}

export async function GET(_request: NextRequest) {
  return NextResponse.json(
    {
      available: false,
      reason: 'removed',
      message: 'Credential recovery via email is no longer supported.'
    },
    { status: 410 }
  );
}