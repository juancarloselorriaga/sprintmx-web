## Ticket 05: Route-Based Namespace Loading and Payload Guardrails [Priority P1]

### Description
Load only required message namespaces per route (or lazily load page namespaces) to reduce payload size, and add checks to prevent oversized serialized messages (Upgrade Plan Phase 3/Step 4). Depends on Tickets 01–04.

### Files and modules
- i18n/request.ts
- i18n/utils.ts (namespace resolution/loading helpers)
- components/providers/intl-provider.tsx (message payload delivery to the client)
- app/[locale]/**/layout.tsx or page entries (namespace lists per route group)
- package.json / scripts (bundle-size or payload check wiring)
- __tests__/** for i18n/SEO payload tests

### Definition of Done
- Request-time loader fetches only the namespaces needed for the current route; no full-dictionary loads on every request.
- Client provider (`components/providers/intl-provider.tsx`) receives only the resolved namespaces for the current route (no fallback to `getMessages()` for the full bundle).
- Lazy-loading or per-route namespace configuration is documented and applied across route groups (public, auth, protected).
- Automated check fails when serialized messages exceed a defined threshold per route/page.
- No regressions to existing localization behavior; routes still render with correct translations and metadata.

### Technical approach
- Introduce a namespace map keyed by route or segment and update `i18n/request.ts` to load only those namespaces.
- Add lazy-loading support for page-specific namespaces where beneficial.
- Implement a lightweight payload-size assertion (e.g., serialize loaded namespaces and compare against a limit) and wire it into tests/CI.
- Update the intl provider to accept and pass through the per-route namespace payload instead of invoking `getMessages()` for the full locale bundle.

### Tests
- Unit tests for the loader to verify namespace selection per route and absence of unused namespaces.
- Add a test that fails when payload size exceeds the configured limit for a sample route set.
- Regression tests for a few representative pages to confirm translations and metadata still resolve.

### Risks and rollout
- Risk of missing namespace mapping causing runtime missing translations; mitigate with defensive logging and test coverage.
- Payload check thresholds may need tuning; start conservative and adjust with measured sizes.
- Consider a feature flag or staged rollout for namespace maps if uncertainty exists.
