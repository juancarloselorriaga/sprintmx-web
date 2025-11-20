import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// Create i18n routing handler
const handleI18nRouting = createMiddleware(routing);

// Define protected and auth-only routes (without locale prefix)
const protectedRoutes = ['/dashboard', '/settings', '/profile'];
const authRoutes = ['/sign-in', '/sign-up'];

export async function proxy(req: NextRequest) {
  // First, handle i18n routing
  const i18nResponse = handleI18nRouting(req);

  // Get the pathname after i18n processing
  const pathname = req.nextUrl.pathname;

  // Remove locale prefix to check routes (e.g., /en/dashboard -> /dashboard)
  const pathnameWithoutLocale = pathname.replace(/^\/(es|en)/, '') || '/';

  // Check if the current route is protected or auth-only
  const isProtectedRoute = protectedRoutes.some(route => pathnameWithoutLocale.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathnameWithoutLocale.startsWith(route));

  // Get session from cookies
  // TODO: Implement proper session decryption when authentication is set up
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;

  // For now, we'll treat any session cookie as authenticated
  // Replace this with proper session validation when auth is implemented
  const isAuthenticated = !!session;

  // Extract locale from pathname
  const localeMatch = pathname.match(/^\/(es|en)/);
  const locale = localeMatch ? localeMatch[1] : 'es';

  // Redirect unauthenticated users trying to access protected routes
  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL(`/${locale}/sign-in`, req.nextUrl));
  }

  // Redirect authenticated users trying to access auth pages
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.nextUrl));
  }

  return i18nResponse;
}

// Configure which routes the proxy should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - trpc (tRPC routes)
     * - _next (Next.js internals)
     * - _vercel (Vercel internals)
     * - Static files (containing a dot)
     */
    '/((?!api|trpc|_next|_vercel|.*\\..*).*)'
  ]
};
