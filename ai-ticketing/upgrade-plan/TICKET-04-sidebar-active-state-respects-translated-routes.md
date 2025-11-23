# Sidebar active state respects translated routes

## Description
Use locale-aware pathname utilities so sidebar highlights correctly on translated URLs.

## Files/Modules Touched
- `components/layout/navigation/sidebar.tsx`
- `i18n/navigation.ts` (read/confirm usage)

## Definition of Done
- Active state matches the correct item on localized and default paths (e.g., `/acerca` and `/about`), including subpaths.
- No false positives on unrelated prefixes.

## Technical Approach
- Switch to `usePathname` from `@/i18n/navigation` and normalize comparisons to internal pathnames or use `getPathname` to align with translated routes.
- Preserve starts-with logic for child routes; ensure `href` object/string handling remains compatible.

## Required Tests
- `pnpm lint`
- `pnpm type-check`
- Manual: navigate `/acerca` and `/about` (plus a nested route) and confirm highlight correctness

## Risks/Rollout Notes
- Ensure nav item `href` types still align with `Link`; avoid breaking routing wrappers.
