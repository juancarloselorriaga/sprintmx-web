# Language switcher preserves search params

## Description
Keep existing query parameters when toggling locales via the language switcher.

## Files/Modules Touched
- `components/language-switcher.tsx`

## Definition of Done
- Switching locale retains current `searchParams` and only swaps the locale prefix.
- Selecting the current locale is a no-op (no duplicate navigation).

## Technical Approach
- Read current query params (e.g., with `useSearchParams` or equivalent from `@/i18n/navigation`).
- Build the same path with preserved params and call `router.replace` with `{ locale: targetLocale }`.
- Keep the early return when the target locale matches the current one.

## Required Tests
- `pnpm lint`
- `pnpm type-check`
- Manual: toggle locale on a page with query params and verify they persist

## Risks/Rollout Notes
- Handle encoded params safely and ensure the hook choice is compatible with app router constraints.
