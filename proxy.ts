import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing, type AppLocale } from './i18n/routing';

// Create i18n routing handler
const handleI18nRouting = createMiddleware(routing);

// Define protected and auth-only routes (internal pathnames)
const protectedRoutes = ['/dashboard', '/settings', '/profile'];
const authRoutes = ['/sign-in', '/sign-up'];

const localesPattern = routing.locales.join('|');
const localePrefixRegex = new RegExp(`^/(${localesPattern})(?=/|$)`);

const isKnownLocale = (value: string): value is AppLocale =>
  routing.locales.includes(value as AppLocale);

const resolvePrefix = (locale: AppLocale) => {
  const prefixSetting = routing.localePrefix as
    | 'always'
    | 'as-needed'
    | 'never'
    | {
        mode?: 'always' | 'as-needed' | 'never';
        prefixes?: Partial<Record<AppLocale, string>>;
      };

  if (typeof prefixSetting === 'object') {
    const mode = prefixSetting.mode ?? 'always';
    if (mode === 'never') return '';
    if (mode === 'as-needed' && locale === routing.defaultLocale) return '';
    const custom = prefixSetting.prefixes?.[locale];
    return custom ?? `/${locale}`;
  }

  if (prefixSetting === 'never') return '';
  if (prefixSetting === 'as-needed') {
    return locale === routing.defaultLocale ? '' : `/${locale}`;
  }

  return `/${locale}`;
};

const getLocaleFromPath = (pathname: string): AppLocale => {
  const match = pathname.match(localePrefixRegex);
  if (match && isKnownLocale(match[1])) return match[1];
  return routing.defaultLocale;
};

const stripLocalePrefix = (pathname: string) => pathname.replace(localePrefixRegex, '') || '/';

const getLocalizedPathname = (internalPathname: string, locale: AppLocale) => {
  const entry = routing.pathnames?.[
    internalPathname as keyof typeof routing.pathnames
  ];

  if (!entry) return internalPathname;
  if (typeof entry === 'string') return entry;
  return entry[locale] ?? internalPathname;
};

const toInternalPath = (pathname: string, locale: AppLocale) => {
  if (pathname === '/') return '/';

  const entries = Object.entries(routing.pathnames ?? {});
  for (const [internal, localized] of entries) {
    const localizedPath = typeof localized === 'string' ? localized : localized[locale];
    if (!localizedPath) continue;

    if (pathname === localizedPath || pathname.startsWith(`${localizedPath}/`)) {
      return internal;
    }
  }

  return pathname;
};

const buildRedirectUrl = (req: NextRequest, targetInternalPath: string, locale: AppLocale) => {
  const localizedPath = getLocalizedPathname(targetInternalPath, locale);
  const prefix = resolvePrefix(locale);
  const normalizedPath = localizedPath === '/' ? '' : localizedPath;
  return new URL(`${prefix}${normalizedPath}`, req.nextUrl);
};

export async function proxy(req: NextRequest) {
  // First, handle i18n routing
  const i18nResponse = handleI18nRouting(req);

  // Get the pathname after i18n processing
  const pathname = req.nextUrl.pathname;

  const locale = getLocaleFromPath(pathname);
  const pathnameWithoutLocale = stripLocalePrefix(pathname);
  const internalPath = toInternalPath(pathnameWithoutLocale, locale);

  // Check if the current route is protected or auth-only using internal pathnames
  const isProtectedRoute = protectedRoutes.some(route => internalPath.startsWith(route));
  const isAuthRoute = authRoutes.some(route => internalPath.startsWith(route));

  // Get session from cookies
  // TODO: Implement proper session decryption when authentication is set up
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;

  // For now, we'll treat any session cookie as authenticated
  // Replace this with proper session validation when auth is implemented
  const isAuthenticated = !!session;

  // Redirect unauthenticated users trying to access protected routes
  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(
      buildRedirectUrl(req, '/sign-in', locale)
    );
  }

  // Redirect authenticated users trying to access auth pages
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(
      buildRedirectUrl(req, '/dashboard', locale)
    );
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
