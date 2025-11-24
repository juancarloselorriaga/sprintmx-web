# Upgrade Plan

## Phases and milestones
- Phase 1: Hardening and metadata source-of-truth
- Phase 2: Refactor and modularize dictionaries
- Phase 3: Performance and payload reduction
- Phase 4: Scalability, observability, and governance

## Critical fixes (dependency ordered)
1. Remove duplicated metadata blocks from `messages/*.json`; keep `messages/metadata/*.json` as the single source for SEO selectors.
2. Add schema/shape enforcement for messages (types + runtime check) to prevent drift when splitting.
3. Introduce locale parity validation to detect missing/extra keys across locales and between UI vs metadata sources.

## Suggested refactors and sequencing
- Extract message namespaces by concern (e.g., `common`, `navigation`, `auth`, `pages/home`, `pages/about`, `components/error`) and load them through `next-intl` per route/namespace.
- Decouple type inference from a single file by defining an explicit `Messages` type (and Zod schema) shared by namespaces, then adjusting consumers (e.g., navigation types) to use the schema instead of `typeof esMessages`.
- Clean unused/duplicated fields (e.g., `ogTitle/ogDescription/ogAlt` in main messages) once metadata is centralized.

## Performance and cost improvements
- Change `i18n/request.ts` to load only required namespaces per route (or lazy-load page namespaces) to avoid shipping full dictionaries on every request.
- Guard against oversized payloads with a bundle-size/check on serialized messages per page.

## Quick wins vs heavy lifts
- Quick wins: Remove duplicated metadata from main dictionaries; add schema/type definition and parity check; prune unused OG fields.
- Heavy lifts: Namespace split with route-based loading; adjusting all consumers to new imports/types;.

## Estimates and impact
- Phase 1: High correctness, medium stability; small maintainability gain; negligible cost; small performance gain from reduced duplication risk.
- Phase 2: Medium correctness, high maintainability; moderate stability risk during refactor; sets foundation for later performance gains.
- Phase 3: Medium performance gain, lower cost (smaller payloads); moderate implementation effort.
- Phase 4: High stability/maintainability via guardrails; minor performance/cost impact; ongoing benefit.

## Execution sequence
1. Centralize metadata: remove metadata blocks from `messages/*.json`; ensure all SEO uses `messages/metadata/*.json`.
2. Define shared message schema/types (TS) and add locale parity validation.
3. Split messages into namespaces by concern and adjust imports/types (navigation, pages, components) to use the schema.
4. Update `i18n/request.ts` to load namespaces per route; add payload size/regression checks.
