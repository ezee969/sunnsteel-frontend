import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Define protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/workouts', '/routines'];
  const publicRoutes = ['/login', '/signup', '/auth'];

  const isProtectedRoute = protectedRoutes.some(route => 
    path.startsWith(route)
  );
  const isPublicRoute = publicRoutes.some(route => 
    path.startsWith(route)
  );

  // Use a lightweight session marker set by the client after verification
  const hasValidSession = request.cookies.get('has_session')?.value === '1';

  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[middleware] Auth check:', {
      path,
      hasValidSession,
      allCookieNames: request.cookies.getAll().map(c => c.name),
      isProtectedRoute,
      isPublicRoute,
      note: 'Using has_session cookie for detection'
    });
  }

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !hasValidSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', path);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages  
  if (isPublicRoute && hasValidSession && (path === '/login' || path === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  const response = NextResponse.next();

  // Add debug headers (keep for monitoring)
  response.headers.set('x-ss-debug-path', path);
  response.headers.set('x-ss-debug-has-valid-session', String(hasValidSession));
  response.headers.set('x-ss-debug-protected', String(isProtectedRoute));

  return response;
}

export const config = {
  matcher: [
    '/login',
    '/signup',
    '/auth/callback',
    '/dashboard/:path*',
    '/workouts/:path*',
    '/routines/:path*',
  ],
};
