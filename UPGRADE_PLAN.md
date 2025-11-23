# UPGRADE PLAN

Derived from the architect audit. Focus: translated routes, SEO, i18n, Next.js 16 + next-intl.

## Phase 0 – Baseline & Checks (0.5 day)
- Confirm current locales and pathnames match routing config (`i18n/routing.ts`); document any future routes needing translations.
- Sanity check build succeeds and current pages render statically (no unexpected dynamic flags).
- Testing: `pnpm lint`, `pnpm type-check`, quick manual smoke of home/about/sign-in in both locales.

## Phase 1 – Critical SEO/I18n Fixes (0.5–1 day)
- Server-set `lang` attribute: Move `lang` to the server-rendered `<html>` in `app/[locale]/layout.tsx`; remove client-only lang dependency. Ensure fonts/body classes are set in the same layout.
- Robots parity: Add English-protected paths to `app/robots.ts` ( `/en/dashboard`, `/en/settings`, `/en/profile` with trailing variants).
- Execution order: (1) lang attribute fix, (2) robots parity, (3) regression check.
- Testing: View HTML source for both locales to verify `lang` is present; run `pnpm lint` and `pnpm type-check`; manual check robots.txt includes both locale variants.
- Impact: High SEO correctness; ensures crawlers see correct locale and protected pages remain deindexed.

## Phase 2 – Navigation & UX Correctness (0.5 day)
- Sidebar active state: Switch `components/layout/navigation/sidebar.tsx` to use `usePathname` from `@/i18n/navigation` (internal pathnames) or normalize to internal paths before comparison so translated URLs highlight correctly.
- Language switcher search params: Preserve `searchParams` when toggling locales if filters are present.
- Testing: Navigate `/acerca` and `/about` to confirm active states; switch locale on a page with query params and verify they persist.
- Impact: Medium; fixes locale-aware navigation clarity and UX continuity.

## Phase 3 – SEO Enhancements (0.5 day)
- Open Graph locale: Thread `openGraphLocale` from `generateAlternateMetadata` into `createLocalizedPageMetadata` so OG uses locale-specific values.
- Sitemap determinism: Freeze `lastModified` to build time (or per-route timestamps) to stabilize caching/CDN.
- Testing: Inspect generated metadata JSON for a page to confirm OG locale; fetch `sitemap.xml` and verify stable timestamps.
- Impact: Medium; strengthens social/SEO signals and cacheability.

## Phase 4 – Hardening & Documentation (0.5 day)
- Document routing rules, prefix logic, and how to add translated routes (README section).
- Add a quick checklist for adding new routes (pathnames entry, messages, metadata, robots/sitemap).
- Testing: Doc review only.
- Impact: Low; improves maintainability and onboarding.

## Quick Wins
- Lang attribute fix and robots parity (Phase 1).
- Sidebar active state fix (Phase 2).

## Heavy Lifts
- None identified; all items are small/medium changes.

## Execution Sequence
1) Phase 1 critical fixes → 2) Phase 2 navigation UX → 3) Phase 3 SEO polish → 4) Phase 4 docs.

## Testing Strategy Summary
- Lint + type-check: `pnpm lint`, `pnpm type-check`.
- Targeted manual: HTML `lang` verification, robots.txt, navigation highlights, locale switch with query params.
- Optional: Add a Jest smoke for sitemap shape and metadata alternates if desired.

## Impact Estimates
- Phase 1: High SEO/accessibility correctness; protects sensitive paths.
- Phase 2: Medium UX correctness; avoids mis-highlights and preserves context on locale switch.
- Phase 3: Medium SEO/social robustness; better cache behavior.
- Phase 4: Low but improves future velocity.
