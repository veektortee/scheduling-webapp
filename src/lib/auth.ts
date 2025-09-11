import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function verifyAuth(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || token.role !== 'admin') {
      return null;
    }

    return token;
  } catch (error) {
    console.error('Authentication verification failed:', error);
    return null;
  }
}

export function createAuthResponse(message: string = 'Unauthorized') {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}
