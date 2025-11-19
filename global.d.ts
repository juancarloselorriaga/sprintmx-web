// TypeScript definitions for next-intl translations
// This file provides type safety and autocomplete for translation keys

type Messages = typeof import('./messages/en.json');

declare global {
  // Use type safe message keys with `next-intl`
  interface IntlMessages extends Messages {}
}

export {};
