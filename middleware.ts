import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check for token presence
  const refreshToken = request.cookies.get('refresh_token')?.value;
  const isAuthenticated = !!refreshToken;
  const path = request.nextUrl.pathname;

  // Auth pages (redirect to dashboard if authenticated)
  const isAuthPage = path === '/login' || path === '/signup';

  // Protected pages (redirect to login if not authenticated)
  const isProtectedPage =
    path.startsWith('/dashboard') ||
    path.startsWith('/workouts') ||
    path.startsWith('/profile') ||
    path.startsWith('/settings');

  // Redirect authenticated users away from auth pages
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
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
  matcher: ['/login', '/signup', '/dashboard/:path*', '/workouts/:path*'],
};
