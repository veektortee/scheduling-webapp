import { NextRequest, NextResponse } from 'next/server';
import { lockoutManager } from '@/lib/lockoutManager';

export async function GET(request: NextRequest) {
  try {
    const lockoutInfo = lockoutManager.getLockoutInfo(request);
    
    return NextResponse.json({
      isLockedOut: lockoutInfo.isLockedOut,
      remainingTime: lockoutInfo.remainingTime,
      attemptCount: lockoutInfo.attemptCount,
      formattedTime: lockoutInfo.remainingTime 
        ? lockoutManager.getFormattedRemainingTime(lockoutInfo.remainingTime)
        : undefined
    });
  } catch (error) {
    console.error('Error checking lockout status:', error);
    return NextResponse.json(
      { error: 'Failed to check lockout status' },
      { status: 500 }
    );
  }
}
