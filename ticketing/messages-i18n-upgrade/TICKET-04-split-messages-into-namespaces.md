## Ticket 04: Split Messages into Namespaces and Update Consumers [Priority P1]

### Description
Refactor dictionaries into focused namespaces (e.g., common, navigation, auth, pages/*, components/*) and load them per route/concern, updating all consumers to the new structure (Upgrade Plan Phase 2/Step 3). Depends on Tickets 01–03 being complete.

### Files and modules
- messages/ (introduce namespace folders/files)
- i18n/navigation.ts
- i18n/routing.ts
- i18n/request.ts
- app/[locale]/**/page.tsx (message selectors)
- components/** (any direct message imports/selectors)

### Definition of Done
- Main dictionaries are split into namespace files with clear responsibility; legacy monolith files removed or left as thin wrappers only if needed temporarily.
- All message imports/selectors in navigation, routing, pages, and components reference the new namespaces.
- Type/schema from Ticket 02 updated to cover the namespaced shape.
- No runtime errors when rendering pages across locales; navigation and component copy resolved from new namespaces.
- Type safe useTranslations and getTranslation functions in components.

### Technical approach
- Define target namespace structure (common, navigation, auth, pages/home, pages/about, etc.) and create corresponding JSON files.
- Update loaders and selectors in `i18n/navigation.ts`, `i18n/routing.ts`, and page components to read from the new namespaces.
- Provide backward compatibility shims only if required for incremental adoption; remove once all consumers are migrated.

### Tests
- Update/add unit tests for navigation/routing to cover the new namespace imports.
- Smoke or integration tests for representative routes (public/auth/protected) to ensure required namespaces load correctly.

### Risks and rollout
- Risk of missing keys during split; rely on parity checker (Ticket 03) and targeted regression tests.
- Potential bundle/payload increase if namespaces are over-bundled; addressed in Ticket 05.
- Consider staged rollout by route group if needed; feature flag not required if split is atomic.
