## Ticket 03: Locale Parity and Metadata Consistency Checks [Priority P0]

### Description
Add automated parity validation to detect missing/extra keys across locales and between UI dictionaries and metadata dictionaries, providing guardrails during the refactor (Upgrade Plan Phase 1/Step 2).

### Files and modules
- scripts/validate-locales.ts (new) or similar check under scripts/
- messages/en.json, messages/es.json
- messages/metadata/en.json, messages/metadata/es.json
- package.json (npm/pnpm script wiring)
- CI config if applicable

### Definition of Done
- A repeatable script reports discrepancies between locales for all namespaces and between UI vs metadata dictionaries.
- CI/test pipeline fails when parity check finds issues; exit codes are non-zero on mismatch.
- Parity report identifies the exact key paths and which locale/file is missing or has extras.
- Documentation in `ticketing/messages-i18n-upgrade/` or README snippet describes how to run the check locally.

### Technical approach
- Implement a diff/validator that traverses both UI and metadata dictionaries and compares key sets for each namespace.
- Add a package script (e.g., `pnpm validate:locales`) invoking the parity checker.
- Wire the checker into CI/test workflow to block merges on parity failures.

### Tests
- Unit tests for the parity checker covering: matching dictionaries, missing keys, extra keys, and metadata-vs-UI drift.
- Include fixtures for both locales to ensure coverage across namespaces.

### Risks and rollout
- Potential false positives if intentional locale differences exist; allow explicit ignore list if needed.
- Risk of longer CI time; keep the checker lightweight and incremental.
- No rollout flag required; can be introduced as a gating step once passing locally.
