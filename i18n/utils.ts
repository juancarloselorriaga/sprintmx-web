import { routing, type AppLocale } from './routing';

/**
 * Type guard to check if a value is a valid locale
 * @param value - The value to check
 * @returns True if the value is a valid AppLocale
 */
export const isValidLocale = (value: string): value is AppLocale =>
  routing.locales.includes(value as AppLocale);
