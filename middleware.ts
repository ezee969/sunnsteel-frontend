import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // For now, let's disable middleware redirects and let the client-side auth handle it
  // This is a temporary fix while we debug the SSR middleware issue

  // Check for any Supabase auth cookies to get a rough idea of auth state
  const allCookies = request.cookies.getAll();
  const supabaseAuthCookies = allCookies.filter(
    ({ name }) =>
      name.startsWith('sb-') &&
      (name.includes('auth-token') || name.includes('access-token'))
  );

  const hasAuthCookies = supabaseAuthCookies.length > 0;

  const response = NextResponse.next();

  // Add debug headers
  response.headers.set('x-ss-debug-path', path);
  response.headers.set(
    'x-ss-debug-auth-cookies',
    String(supabaseAuthCookies.length)
  );
  response.headers.set('x-ss-debug-has-auth', String(hasAuthCookies));

  // Log for debugging
  console.log('🛡️ Middleware:', {
    path,
    authCookies: supabaseAuthCookies.length,
    cookieNames: supabaseAuthCookies.map(({ name }) => name),
  });

  // For now, we're disabling server-side redirects and letting the client handle auth
  // This allows the auth provider to properly manage the authentication state

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
