import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/workouts',
  '/routines',
  '/profile',
  '/settings',
  '/search',
] as const;

const AUTH_PAGES = new Set(['/login', '/signup']);

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const hasValidSession = request.cookies.get('ss_session')?.value === '1';

  if (isProtectedPath(path) && !hasValidSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', `${path}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (AUTH_PAGES.has(path) && hasValidSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/signup',
    // '/auth/:path*' used to be here. The function does nothing with those
    // paths (they are in neither PROTECTED_PREFIXES nor AUTH_PAGES), so every
    // visit to /auth/callback paid a middleware invocation to fall through to
    // NextResponse.next(). Removed in TD-16.
    '/dashboard/:path*',
    '/workouts/:path*',
    '/routines/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/search/:path*',
  ],
};
