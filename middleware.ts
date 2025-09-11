import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Read cookies available on the frontend domain
  const refreshToken = request.cookies.get('refresh_token')?.value;
  const hasSession = request.cookies.get('has_session')?.value === 'true';
  const isAuthenticated = Boolean(hasSession || refreshToken);
  const path = request.nextUrl.pathname;

  // Protected pages (redirect to login if not authenticated)
  const isProtectedPage =
    path.startsWith('/dashboard') ||
    path.startsWith('/workouts') ||
    path.startsWith('/routines') ||
    path.startsWith('/profile') ||
    path.startsWith('/settings');

  // Auth pages: redirect if session marker is present
  const isAuthPage = path === '/login' || path === '/signup';
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect unauthenticated users away from protected pages
  if (isProtectedPage && !isAuthenticated) {
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
