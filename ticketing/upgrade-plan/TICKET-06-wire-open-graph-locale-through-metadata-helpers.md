# Wire Open Graph locale through metadata helpers

## Description
Thread `openGraphLocale` from `generateAlternateMetadata` into `createLocalizedPageMetadata` so Open Graph metadata uses locale-specific values.

## Files/Modules Touched
- `utils/seo.ts`
- `__tests__/utils/seo.test.ts`

## Definition of Done
- `createLocalizedPageMetadata` sets OG locale based on `generateAlternateMetadata` output.
- Tests updated/added to assert locale-specific OG values without altering alternates/canonical behavior.

## Technical Approach
- Destructure `openGraphLocale` from `generateAlternateMetadata` in `createLocalizedPageMetadata`.
- Pass it as the OG override into `createPageMetadata` (or merge onto returned metadata) so OG locale matches the current locale.
- Update Jest tests to cover OG locale per locale.

## Required Tests
- `pnpm lint`
- `pnpm type-check`
- `pnpm test __tests__/utils/seo.test.ts` (or full suite including these cases)

## Risks/Rollout Notes
- Ensure alternates/canonical remain unchanged; watch for type impacts on `Metadata`.
