## Ticket 02: Message Schema and Runtime Validation [Priority P0]

### Description
Define an explicit `Messages` type plus a Zod (or similar) schema to enforce message shape at runtime, preventing drift while dictionaries are refactored (Upgrade Plan Phase 1/Step 2).

### Files and modules
- i18n/types.ts
- i18n/utils.ts (or wherever dictionaries are loaded/parsed)
- i18n/request.ts
- messages/*.json

### Definition of Done
- `Messages` type defined without relying on `typeof` a single locale file; schema covers all namespaces/fields currently in use.
- Runtime validation runs when loading dictionaries (server-side) and fails fast with actionable errors if shape mismatches occur.
- Build/test pipeline fails on invalid dictionaries; error messages point to offending keys/paths.
- No regressions to existing type consumers (navigation, routes, components) after type/schema introduction.

### Technical approach
- Author a shared Zod (or equivalent) schema for the message tree and export a derived `Messages` type.
- Update dictionary loading in `i18n/utils.ts`/`i18n/request.ts` to validate raw JSON against the schema and surface structured errors.
- Replace `typeof esMessages`-style inference with the explicit `Messages` type across i18n consumers.

### Tests
- Add unit tests for schema validation with valid and invalid sample dictionaries.
- Add a failing test case for missing/extra keys to ensure runtime checks catch drift.
- Consider a small integration test for `i18n/request.ts` to confirm validation runs during load.

### Risks and rollout
- Risk of over-strict schema blocking deploy; mitigate with clear error messages and incremental tightening if needed.
- Potential type ripple effects; mitigate by updating impacted imports and running type checks.
- No rollout flag needed; rely on CI/typecheck gating.
