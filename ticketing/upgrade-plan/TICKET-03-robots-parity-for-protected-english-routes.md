# Robots parity for protected English routes

## Description
Add English-protected paths (with trailing variants) to `app/robots.ts` so robots.txt matches Spanish coverage.

## Files/Modules Touched
- `app/robots.ts`

## Definition of Done
- Disallow list includes `/en/dashboard`, `/en/dashboard/`, `/en/settings`, `/en/settings/`, `/en/profile`, `/en/profile/` alongside existing Spanish entries.
- Sitemap reference unchanged.

## Technical Approach
- Extend the `disallow` array with English route variants.
- Keep existing structure and config intact.

## Required Tests
- `pnpm lint`
- Manual: fetch `http://localhost:3000/robots.txt` and verify both locale variants

## Risks/Rollout Notes
- Minimal risk; double-check paths for typos.
