# Document translated routing and checklist

## Description
Add README guidance for routing rules, locale prefixes, and translating/adding routes, plus a concise checklist for new routes.

## Files/Modules Touched
- `README.md`
- References: `i18n/routing.ts`, `messages/*`, `app/*` (for links/examples)

## Definition of Done
- README contains a section explaining `routing.localePrefix`, `routing.pathnames`, where to place translations/metadata, and a checklist for adding new routes.
- Instructions match current routing configuration and terminology.

## Technical Approach
- Append a README section covering prefix logic, how `routing.pathnames` maps internal to external paths, and where to update messages/SEO/robots/sitemap.
- Provide a bullet checklist for adding a new translated route (pathnames entry, messages, metadata, robots/sitemap).
- Include file path references for clarity; avoid duplicating existing docs.

## Required Tests
- Documentation review only

## Risks/Rollout Notes
- Keep guidance aligned with current routing setup to avoid drift; update if routing config changes in future phases.
