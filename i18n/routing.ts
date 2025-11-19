import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['es', 'en'],

  // Used when no locale matches
  defaultLocale: 'es',

  // Use 'as-needed' to hide the default locale prefix
  // Spanish (default): /about
  // English: /en/about
  localePrefix: 'as-needed'
});


export type AppLocale = typeof routing.locales[number];

