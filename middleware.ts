import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  console.log(`� SIMPLE MIDDLEWARE TRIGGERED: ${request.nextUrl.pathname}`)
  
  // If accessing root without auth, redirect to login
  if (request.nextUrl.pathname === '/') {
    console.log('🚨 ROOT ACCESS - REDIRECTING TO LOGIN')
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth (NextAuth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - public folder
     * - login page
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public|login).*)',
  ],
}
