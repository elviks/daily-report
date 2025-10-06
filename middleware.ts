import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Set request timeout headers
  const response = NextResponse.next();
  
  // Add timeout headers
  response.headers.set('X-Request-Timeout', '30000'); // 30 seconds
  response.headers.set('Connection', 'keep-alive');
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
