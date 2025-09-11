import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Read cookies available on the frontend domain
  const refreshToken = request.cookies.get('refresh_token')?.value;
  const hasSession = request.cookies.get('has_session')?.value === 'true';
  const isAuthenticated = Boolean(hasSession || refreshToken);
  const path = request.nextUrl.pathname;

  // Prepare a base response we can attach debug headers to
  const base = NextResponse.next();
  base.headers.set('x-ss-debug-path', path);
  base.headers.set('x-ss-debug-has-session', String(hasSession));
  base.headers.set('x-ss-debug-has-rt', String(Boolean(refreshToken)));

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
    const res = NextResponse.redirect(new URL('/dashboard', request.url));
    res.headers.set('x-ss-debug-redirect', 'login->/dashboard');
    res.headers.set('x-ss-debug-has-session', String(hasSession));
    res.headers.set('x-ss-debug-has-rt', String(Boolean(refreshToken)));
    return res;
  }

  // Redirect unauthenticated users away from protected pages
  if (isProtectedPage && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', path);
    const res = NextResponse.redirect(loginUrl);
    res.headers.set('x-ss-debug-redirect', `${path}->/login`);
    res.headers.set('x-ss-debug-has-session', String(hasSession));
    res.headers.set('x-ss-debug-has-rt', String(Boolean(refreshToken)));
    return res;
  }

  return base;
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
