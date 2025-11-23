# Deterministic sitemap lastModified

## Description
Stabilize `lastModified` in `app/sitemap.ts` to a build-time constant (or per-route timestamp) instead of recalculating on every request.

## Files/Modules Touched
- `app/sitemap.ts`

## Definition of Done
- Sitemap entries reuse a deterministic timestamp for `lastModified` rather than `new Date()` per entry.
- Route generation per locale remains unchanged.

## Technical Approach
- Capture a timestamp once at module load (e.g., `const buildTimestamp = new Date(process.env.BUILD_TIME ?? Date.now());`) and reuse it for all entries.
- Keep existing changeFrequency/priority logic intact.

## Required Tests
- `pnpm lint`
- `pnpm type-check`
- Manual: fetch `sitemap.xml` twice and confirm `lastModified` stays stable

## Risks/Rollout Notes
- Choose a timezone-safe value; ensure environment override doesn’t produce invalid dates.
