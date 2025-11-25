import { AsyncLocalStorage } from 'node:async_hooks';
import { z } from 'zod';
import { routing, type AppLocale } from './routing';
import {
  type Messages,
  authSchema,
  commonSchema,
  componentsSchema,
  errorsSchema,
  messagesSchema,
  navigationSchema,
  pagesSchema,
} from './types';

type ParsedIssue = { path: PropertyKey[]; message: string };

type NamespaceLoader<T> = (locale: AppLocale) => Promise<T>;

type NamespaceSelection = {
  base: (keyof typeof rootNamespaceLoaders)[];
  components: (keyof typeof componentNamespaceLoaders)[];
  pages: (keyof typeof pageNamespaceLoaders)[];
};

const rootNamespaceLoaders = {
  common: (targetLocale: AppLocale) =>
    import(`@/messages/common/${targetLocale}.json`).then((mod) => mod.default),
  navigation: (targetLocale: AppLocale) =>
    import(`@/messages/navigation/${targetLocale}.json`).then((mod) => mod.default),
  auth: (targetLocale: AppLocale) =>
    import(`@/messages/auth/${targetLocale}.json`).then((mod) => mod.default),
  errors: (targetLocale: AppLocale) =>
    import(`@/messages/errors/${targetLocale}.json`).then((mod) => mod.default),
} satisfies Record<string, NamespaceLoader<unknown>>;

const componentNamespaceLoaders = {
  footer: (targetLocale: AppLocale) =>
    import(`@/messages/components/footer/${targetLocale}.json`).then((mod) => mod.default),
  themeSwitcher: (targetLocale: AppLocale) =>
    import(`@/messages/components/theme-switcher/${targetLocale}.json`).then((mod) => mod.default),
  errorBoundary: (targetLocale: AppLocale) =>
    import(`@/messages/components/error-boundary/${targetLocale}.json`).then((mod) => mod.default),
  localeSwitcher: (targetLocale: AppLocale) =>
    import(`@/messages/components/locale-switcher/${targetLocale}.json`).then((mod) => mod.default),
} satisfies Record<string, NamespaceLoader<unknown>>;

const pageNamespaceLoaders = {
  home: (targetLocale: AppLocale) =>
    import(`@/messages/pages/home/${targetLocale}.json`).then((mod) => mod.default),
  about: (targetLocale: AppLocale) =>
    import(`@/messages/pages/about/${targetLocale}.json`).then((mod) => mod.default),
  contact: (targetLocale: AppLocale) =>
    import(`@/messages/pages/contact/${targetLocale}.json`).then((mod) => mod.default),
  events: (targetLocale: AppLocale) =>
    import(`@/messages/pages/events/${targetLocale}.json`).then((mod) => mod.default),
  news: (targetLocale: AppLocale) =>
    import(`@/messages/pages/news/${targetLocale}.json`).then((mod) => mod.default),
  results: (targetLocale: AppLocale) =>
    import(`@/messages/pages/results/${targetLocale}.json`).then((mod) => mod.default),
  help: (targetLocale: AppLocale) =>
    import(`@/messages/pages/help/${targetLocale}.json`).then((mod) => mod.default),
  dashboard: (targetLocale: AppLocale) =>
    import(`@/messages/pages/dashboard/${targetLocale}.json`).then((mod) => mod.default),
  profile: (targetLocale: AppLocale) =>
    import(`@/messages/pages/profile/${targetLocale}.json`).then((mod) => mod.default),
  settings: (targetLocale: AppLocale) =>
    import(`@/messages/pages/settings/${targetLocale}.json`).then((mod) => mod.default),
  team: (targetLocale: AppLocale) =>
    import(`@/messages/pages/team/${targetLocale}.json`).then((mod) => mod.default),
  signIn: (targetLocale: AppLocale) =>
    import(`@/messages/pages/sign-in/${targetLocale}.json`).then((mod) => mod.default),
  signUp: (targetLocale: AppLocale) =>
    import(`@/messages/pages/sign-up/${targetLocale}.json`).then((mod) => mod.default),
} satisfies Record<string, NamespaceLoader<unknown>>;

const DEFAULT_BASE_NAMESPACES = Object.keys(rootNamespaceLoaders) as (
  keyof typeof rootNamespaceLoaders
)[];
const DEFAULT_COMPONENT_NAMESPACES = [
  'footer',
  'themeSwitcher',
  'errorBoundary',
  'localeSwitcher',
] as (keyof typeof componentNamespaceLoaders)[];
const ALL_PAGES = Object.keys(pageNamespaceLoaders) as (keyof typeof pageNamespaceLoaders)[];

const FULL_SELECTION: NamespaceSelection = {
  base: DEFAULT_BASE_NAMESPACES,
  components: DEFAULT_COMPONENT_NAMESPACES,
  pages: ALL_PAGES,
};

const publicSelection = (pages: NamespaceSelection['pages'] = []): NamespaceSelection => ({
  base: DEFAULT_BASE_NAMESPACES,
  components: DEFAULT_COMPONENT_NAMESPACES,
  pages,
});

const protectedSelection = (pages: NamespaceSelection['pages'] = []): NamespaceSelection => ({
  base: DEFAULT_BASE_NAMESPACES,
  components: ['themeSwitcher', 'localeSwitcher', 'errorBoundary'],
  pages,
});

const authSelection = (pages: NamespaceSelection['pages'] = []): NamespaceSelection => ({
  base: ['common', 'auth', 'errors'],
  components: ['errorBoundary'],
  pages,
});

const routeNamespaceMap: Record<string, NamespaceSelection> = {
  // Public routes share navigation, footer, and themed controls
  '/': publicSelection(['home']),
  '/about': publicSelection(['about']),
  '/contact': publicSelection(['contact']),
  '/events': publicSelection(['events']),
  '/news': publicSelection(['news']),
  '/results': publicSelection(['results']),
  '/help': publicSelection(['help']),
  // Privacy/terms use base layout only (no page-specific content yet)
  '/privacy': publicSelection(),
  '/terms': publicSelection(),
  // Auth routes avoid navigation/footer payloads
  '/sign-in': authSelection(['signIn']),
  '/sign-up': authSelection(['signUp']),
  // Protected dashboard surfaces omit the footer but keep navigation controls
  '/dashboard': protectedSelection(['dashboard']),
  '/profile': protectedSelection(['profile']),
  '/settings': protectedSelection(['settings']),
};

const localePathLookup = buildLocalePathLookup();
// Tracks the current route context across loader call sites so request-time config
// and layout rendering can share the resolved pathname/messages for the same request.
const routeContext = new AsyncLocalStorage<{ pathname: string; messages?: Messages }>();

export const ROUTE_MESSAGES_BYTE_LIMIT = 7500;
export const isValidLocale = (value: string): value is AppLocale =>
  routing.locales.includes(value as AppLocale);

const formatZodIssues = (issues: ParsedIssue[]) =>
  issues
    .map((issue) => {
      const path = issue.path.map(String).join('.') || '<root>';
      return `${path}: ${issue.message}`;
    })
    .join('; ');

const loadNamespaceGroup = async <const TLoaders extends Record<string, NamespaceLoader<unknown>>>(
  locale: AppLocale,
  loaders: TLoaders
) => {
  const entries = await Promise.all(
    Object.entries(loaders).map(
      async ([key, loader]) => [key, await loader(locale)] as const
    )
  );

  return Object.fromEntries(entries) as {
    [K in keyof TLoaders]: Awaited<ReturnType<TLoaders[K]>>;
  };
};

const rootSchemas = {
  common: commonSchema,
  navigation: navigationSchema,
  auth: authSchema,
  errors: errorsSchema,
} as const;

export function validateMessages(locale: string, raw: unknown): Messages {
  const result = messagesSchema.safeParse(raw);

  if (!result.success) {
    const formattedIssues = formatZodIssues(result.error.issues);
    throw new Error(`Invalid messages for locale "${locale}": ${formattedIssues}`);
  }

  return result.data;
}

function pickLoaders<TLoaders, TKey extends keyof TLoaders>(
  loaders: TLoaders,
  keys: readonly TKey[]
) {
  return keys.reduce(
    (acc, key) => ({ ...acc, [key]: loaders[key] }),
    {} as Pick<TLoaders, TKey>
  );
}

function normalizePathname(pathname: string | undefined): string {
  if (!pathname) return '/';
  const withoutQuery = pathname.split('?')[0]?.split('#')[0] ?? '';
  const ensuredLeadingSlash = withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
  const trimmed =
    ensuredLeadingSlash !== '/' ? ensuredLeadingSlash.replace(/\/+$/, '') || '/' : '/';
  const segments = trimmed.split('/').filter(Boolean);

  if (segments.length > 0 && routing.locales.includes(segments[0] as AppLocale)) {
    segments.shift();
  }

  const localized = `/${segments.join('/')}`;
  return localePathLookup[localized] ?? (segments.length ? localized : '/');
}

function buildLocalePathLookup() {
  const lookup: Record<string, string> = {};

  Object.entries(routing.pathnames).forEach(([canonical, localized]) => {
    if (typeof localized === 'string') {
      lookup[localized] = canonical;
    } else {
      Object.values(localized).forEach((path) => {
        lookup[path] = canonical;
      });
    }
  });

  return lookup;
}

export function rememberRoutePath(pathname: string) {
  const normalized = normalizePathname(pathname);
  setRouteContext(normalized);
  return normalized;
}

export async function getRequestPathname(): Promise<string> {
  const existing = routeContext.getStore();
  if (existing?.pathname) {
    return existing.pathname;
  }

  const normalized = normalizePathname('/');
  setRouteContext(normalized);
  return normalized;
}

function resolveRouteNamespaces(pathname: string): NamespaceSelection {
  const normalized = normalizePathname(pathname);
  return (
    routeNamespaceMap[normalized] ?? {
      base: DEFAULT_BASE_NAMESPACES,
      components: DEFAULT_COMPONENT_NAMESPACES,
      pages: [],
    }
  );
}

function makePickRecord<TKeys extends readonly string[]>(keys: TKeys) {
  return keys.reduce(
    (acc, key) => ({ ...acc, [key]: true }),
    {} as Record<TKeys[number], true>
  );
}

function buildSchema(selection: NamespaceSelection) {
  const shape: Record<string, z.ZodTypeAny> = {};

  selection.base.forEach((key) => {
    shape[key] = rootSchemas[key];
  });

  if (selection.components.length) {
    shape.components = componentsSchema.pick(makePickRecord(selection.components));
  }

  if (selection.pages.length) {
    shape.pages = pagesSchema.pick(makePickRecord(selection.pages));
  }

  return z.object(shape).strict();
}

function isFullSelection(selection: NamespaceSelection) {
  return (
    selection.base.length === FULL_SELECTION.base.length &&
    selection.components.length === FULL_SELECTION.components.length &&
    selection.pages.length === FULL_SELECTION.pages.length &&
    selection.base.every((ns, index) => ns === FULL_SELECTION.base[index]) &&
    selection.components.every((ns, index) => ns === FULL_SELECTION.components[index]) &&
    selection.pages.every((ns, index) => ns === FULL_SELECTION.pages[index])
  );
}

function validateSelectedMessages(
  locale: string,
  selection: NamespaceSelection,
  raw: unknown
): Messages {
  const schema = isFullSelection(selection) ? messagesSchema : buildSchema(selection);
  const result = schema.safeParse(raw);

  if (!result.success) {
    const formattedIssues = formatZodIssues(result.error.issues as ParsedIssue[]);
    throw new Error(`Invalid messages for locale "${locale}": ${formattedIssues}`);
  }

  return result.data as Messages;
}

function setRouteContext(pathname: string, messages?: Messages) {
  const current = routeContext.getStore();
  if (current) {
    current.pathname = pathname;
    if (messages) current.messages = messages;
    return;
  }

  routeContext.enterWith({ pathname, messages });
}

function assertPayloadSize(messages: Messages, pathname: string) {
  const size = Buffer.byteLength(JSON.stringify(messages));
  const warnThreshold = Math.floor(ROUTE_MESSAGES_BYTE_LIMIT * 0.8);

  if (size > warnThreshold && size <= ROUTE_MESSAGES_BYTE_LIMIT) {
    // Soft warning to make oversized payloads visible during development
    console.warn(
      `[i18n] Serialized messages for "${pathname}" approaching limit (${size}/${ROUTE_MESSAGES_BYTE_LIMIT} bytes).`
    );
  }

  if (size > ROUTE_MESSAGES_BYTE_LIMIT) {
    throw new Error(
      `Serialized messages for "${pathname}" exceed ${ROUTE_MESSAGES_BYTE_LIMIT} bytes (got ${size}).`
    );
  }

  return size;
}

async function loadMessagesForSelection(
  locale: AppLocale,
  selection: NamespaceSelection
): Promise<Messages> {
  const [baseNamespaces, componentNamespaces, pageNamespaces] = await Promise.all([
    loadNamespaceGroup(locale, pickLoaders(rootNamespaceLoaders, selection.base)),
    selection.components.length
      ? loadNamespaceGroup(locale, pickLoaders(componentNamespaceLoaders, selection.components))
      : Promise.resolve({}),
    selection.pages.length
      ? loadNamespaceGroup(locale, pickLoaders(pageNamespaceLoaders, selection.pages))
      : Promise.resolve({}),
  ]);

  const merged = {
    ...baseNamespaces,
    ...(selection.components.length && { components: componentNamespaces }),
    ...(selection.pages.length && { pages: pageNamespaces }),
  };

  return validateSelectedMessages(locale, selection, merged);
}

export async function loadMessages(locale: AppLocale): Promise<Messages> {
  return loadMessagesForSelection(locale, FULL_SELECTION);
}

/**
 * Load only the namespaces mapped to a specific route.
 *
 * - Normalizes the incoming pathname (handles locale prefixes and localized pathnames)
 * - Reuses messages stored in AsyncLocalStorage for the current request if available
 * - Validates the selected namespaces against partial schemas
 * - Enforces payload-size guardrails before returning
 */
export async function loadRouteMessages(
  locale: AppLocale,
  pathname: string
): Promise<Messages> {
  const normalizedPath = normalizePathname(pathname);
  const existing = routeContext.getStore();
  if (existing?.messages && existing.pathname === normalizedPath) {
    return existing.messages;
  }

  const selection = resolveRouteNamespaces(normalizedPath);
  const messages = await loadMessagesForSelection(locale, selection);

  assertPayloadSize(messages, normalizedPath);
  setRouteContext(normalizedPath, messages);
  return messages;
}
