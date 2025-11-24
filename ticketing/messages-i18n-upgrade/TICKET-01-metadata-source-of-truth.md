## Ticket 01: Metadata Source of Truth for SEO [Priority P0]

### Description
Centralize SEO metadata by removing duplicated `metadata` blocks from `messages/*.json` and ensuring all page metadata is read from `messages/metadata/*.json`, aligning with Upgrade Plan Phase 1/Step 1.

### Files and modules
- messages/en.json
- messages/es.json
- messages/metadata/en.json
- messages/metadata/es.json
- utils/seo.ts
- app/[locale]/**/page.tsx (metadata exports using `createLocalizedPageMetadata`)

### Definition of Done
- `messages/en.json` and `messages/es.json` no longer contain page-level `metadata` entries; corresponding entries live only in `messages/metadata/*.json`.
- All metadata selectors in `utils/seo.ts` and page `generateMetadata` functions read from the metadata dictionaries, not from main message dictionaries.
- No broken imports or runtime errors when generating metadata for any locale; metadata values match previous outputs.
- Tests for SEO helpers updated or added to cover metadata selection from `messages/metadata/*.json`.

### Technical approach
- Move remaining `metadata` blocks from main dictionaries into `messages/metadata/*.json`, keeping structure identical.
- Update `createLocalizedPageMetadata` (and related helpers if needed) to load/use the metadata dictionaries as the single source.
- Adjust page-level `generateMetadata` selectors to point at metadata dictionaries instead of main message trees.
- Remove any unused OG fields once metadata is centralized, per plan guidance.

### Tests
- Extend `__tests__/utils/seo.test.ts` to assert metadata is sourced from `messages/metadata/*.json`.
- Add/adjust snapshot or functional tests for representative routes (public, auth, protected) to ensure metadata parity across locales.

### Risks and rollout
- Risk of missing metadata key during move; mitigate with a diff/validation step before removal.
- Potential route-specific metadata regression; mitigate with targeted smoke tests on affected pages.
- No rollout flag needed; validate in staging with SEO checks before release.
