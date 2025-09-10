import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check for token presence
  const refreshToken = request.cookies.get('refresh_token')?.value;
  const isAuthenticated = !!refreshToken;
  const path = request.nextUrl.pathname;
  const hasSession = request.cookies.get('has_session')?.value === 'true';

  // Protected pages (redirect to login if not authenticated)
  const isProtectedPage =
    path.startsWith('/dashboard') ||
    path.startsWith('/workouts') ||
    path.startsWith('/routines') ||
    path.startsWith('/profile') ||
    path.startsWith('/settings');

  // Auth pages: redirect only if refresh_token exists.
  // If stale has_session exists without refresh_token, clear it and allow access.
  const isAuthPage = path === '/login' || path === '/signup';
  if (isAuthPage) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    if (hasSession && !isAuthenticated) {
      const res = NextResponse.next();
      res.cookies.delete('has_session');
      return res;
    }
  }

  // Redirect unauthenticated users away from protected pages
  if (isProtectedPage && !isAuthenticated) {
    // Remember where they were trying to go
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/signup',
    '/dashboard/:path*',
    '/workouts/:path*',
    '/routines/:path*',
  ],
};
