# Server-rendered html lang in locale layout

## Description
Set `<html lang>` on the server within `app/[locale]/layout.tsx`, co-locate font/body classes there, and remove the client-only `HtmlLangSetter`.

## Files/Modules Touched
- `app/[locale]/layout.tsx`
- `app/layout.tsx`
- `components/providers/html-lang-setter.tsx`

## Definition of Done
- `<html lang>` rendered from server using `params.locale`.
- Font/body classes applied in the same locale layout without duplication.
- `HtmlLangSetter` removed or unused; no hydration warnings introduced.

## Technical Approach
- Move `<html>`/`<body>` wrapper (including font class names) into `app/[locale]/layout.tsx` and set `lang` directly.
- Simplify `app/layout.tsx` to avoid nested html/body and keep providers intact.
- Remove `HtmlLangSetter` usage; delete file if unused.

## Required Tests
- `pnpm lint`
- `pnpm type-check`
- Manual: view page source for es/en to confirm `lang`; smoke home/about for hydration sanity

## Risks/Rollout Notes
- Ensure suspense/providers still wrap children correctly and font classes remain applied.
