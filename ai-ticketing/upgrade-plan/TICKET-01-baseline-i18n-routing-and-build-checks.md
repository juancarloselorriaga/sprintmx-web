# Baseline i18n routing and build checks

## Description
Verify current locales and pathnames match `i18n/routing.ts`, note any missing translated routes, and ensure the existing build passes before making changes.

## Files/Modules Touched
- `i18n/routing.ts`
- `app/**/*` (read-only inspection of routes)
- `README.md` (notes if discrepancies)

## Definition of Done
- Routing locales/pathnames reviewed and mismatches documented.
- `pnpm lint` and `pnpm type-check` pass on current state.
- Manual smoke of home/about/sign-in in both locales completed with notes.

## Technical Approach
- Inspect `routing.locales` and `routing.pathnames` against existing `app/[locale]/...` pages to spot gaps.
- Record any missing translations or route inconsistencies in a short note (e.g., `README.md` or a temp doc).
- Run `pnpm lint` and `pnpm type-check`.
- Manually load home/about/sign-in in es/en and capture observations.

## Required Tests
- `pnpm lint`
- `pnpm type-check`
- Manual: home/about/sign-in in es/en

## Risks/Rollout Notes
- Pure verification; no code changes expected. Surface blockers early before later tickets proceed.
