## 1. Problem & Context (RungoMX-specific)

- **Authentication stack**
    - Auth is handled by Better Auth, configured with a Drizzle adapter over the Neon-backed
      Postgres database.
    - A central auth module exposes a `getSession` helper (wrapping `auth.api.getSession` +
      `headers()`) and a `getCurrentUser` helper; these are used in server components, layouts, and
      actions.
    - The Better Auth HTTP handler is exposed via a single Next.js API route, with custom error
      normalization but no profile- or role-specific logic.
    - A proxy layer (Next 16 proxies-style middleware) performs early redirects based on the
      presence of the Better Auth session cookie, treating this as an *optimistic* check; the real
      security boundary is the protected layout.

- **How user/session state reaches the frontend**
    - On the **server**, the protected route group layout calls `getSession` to enforce that a valid
      session exists before rendering the authenticated app shell. Individual pages (e.g. the
      dashboard) may call `getSession` again for page-specific behavior.
    - On the **client**, a Better Auth React client exposes `useSession`, `signIn`, `signOut`, and
      `signUp`. Header/navigation components use `useSession` to decide which CTAs to show, and auth
      forms use `signIn`/`signUp` then push to `/dashboard`.
    - An app-wide `Providers` component currently only handles theme state; there is no global
      auth/profile provider beyond the `useSession` hook.

- **Profile model**
    - The database defines a 1:1 `profiles` table linked to `users` via `userId`, with fields for
      personal, contact, and physical information.
    - Relations expose a `profile` relation from `users` and a `user` relation from `profiles`, but
      there is no dedicated profile module or service yet.
    - There is a protected `/profile` route and navigation item, but the page only renders static
      copy and does not read or write profile data.

- **Roles and internal/admin users**
    - The database includes `roles` and `user_roles` tables, with tests around assignment and
      cascade delete, but the runtime application does not yet consume them.
    - There is no current notion of “internal/admin” vs “external” users in auth/session helpers,
      the proxy layer, or layouts.

- **Current gap**
    - Non-internal users can sign in (via email/password or social), be redirected to `/dashboard`,
      and navigate the protected shell (`/dashboard`, `/settings`, `/profile`) with only a basic
      session check in the protected layout.
    - The presence and completeness of a profile are **never** evaluated in the auth pipeline,
      layouts, or server actions.
    - Roles exist in the database but are not projected onto the session or used to exempt
      internal/admin users from any enforcement.
    - As a result, today a user can be fully authenticated and “using the app” while having no
      profile row or an incomplete profile.

This epic closes the gap by making “profile completeness” a first-class backend concept that flows
into the session and is enforced consistently in the protected shell and backend operations, while
allowing clearly defined internal/admin users to bypass the requirement.

---

## 2. Architectural Goals & Constraints

- **Single source of truth for profile enforcement**
    - Centralize the notion of “profile completeness” in a dedicated backend abstraction (e.g. a
      profile service), not scattered across forms, layouts, or individual API handlers.
    - Derive a minimal `profileStatus` object (e.g.
      `{ hasProfile, isComplete, mustCompleteProfile }`) that becomes the canonical flag set for
      both server and client.

- **Backend-driven enforcement**
    - All decisions about whether a user must complete a profile are computed on the backend based
      on the user, profile, and roles.
    - The frontend never re-implements completeness rules; it only consumes flags exposed via the
      session/auth helpers and server actions.

- **Role-aware exemptions**
    - Define a small, explicit set of role names that constitute “internal/admin” users.
    - Compute an `isInternal` flag in the same central auth/profile context and ensure all
      enforcement paths check this flag before blocking.

- **Integration with existing auth & routing**
    - Extend, rather than replace, the current Better Auth configuration and `getSession`/
      `getCurrentUser` helpers.
    - Respect the existing two-layer auth design: proxy for UX, protected layout for real security.
    - Integrate with the i18n routing utilities so that redirects and “intended route” handling use
      canonical paths.

- **Extensibility & minimal surface area**
    - Keep `profileStatus` and role flags small and stable so that adding new required fields later
      only touches the profile service.
    - Provide reusable backend guards (e.g. “require profile-complete user”) for future server
      actions and routes.

- **UX constraint: captive but not fragile**
    - The captive modal must block meaningful interaction with protected content for non-internal
      incomplete users, but:
        - It should not rely on fragile client-only state.
        - It should degrade gracefully (e.g. if the modal fails, protected server actions should
          still reject incomplete users).

---

## 3. Backend Architecture Overview

### 3.1 Core abstractions

- **Profile module**
    - Introduce a dedicated profile module (mirroring the structure of the existing
      contact-submission module) that owns:
        - Zod schemas for profile input and profile record validation.
        - Repository functions to read/write profile rows by `userId`.
        - A pure function `computeProfileStatus(user, profile)` that returns a small `profileStatus`
          object:
            - `hasProfile`: whether a row exists.
            - `isComplete`: whether all required fields are present/valid.
            - `mustCompleteProfile`: derived flag used for enforcement (e.g.
              `!isInternal && !isComplete`).
    - This module is the **only place** that knows which fields are required or how completeness is
      defined.

- **Role classification helper**
    - Build a small helper in the auth/domain layer that:
        - Loads roles for a user (via the existing `roles`/`user_roles` tables).
        - Returns both the raw role names and an `isInternal` boolean (computed from a configured
          set of internal/admin role names).
    - This helper must be reusable by both the auth context and any future permission checks.

- **Auth context helper**
    - On the server, introduce an `getAuthContext()`-style helper that:
        - Calls `auth.api.getSession({ headers })` once (reusing the existing `getSession` helper
          and its React `cache` wrapper).
        - For authenticated users:
            - Loads their roles and computes `isInternal`.
            - Loads their profile (if any) and computes `profileStatus` via the profile module.
        - Returns a normalized object:
            - `session`: the raw Better Auth session (or `null`).
            - `user`: the session user (or `null`).
            - `roles`: an array of role names.
            - `isInternal`: boolean.
            - `profileStatus`: `{ hasProfile, isComplete, mustCompleteProfile }`.
    - This helper becomes the **single backend entrypoint** for “who is this user and do we need to
      enforce profile completion?”.

### 3.2 Where “must complete profile” is computed & stored

- **Computation**
    - Primary computation happens in the profile module’s `computeProfileStatus`, which is invoked
      by the auth context helper.
    - `computeProfileStatus` receives:
        - The current user identity (including any basic fields needed for completeness checks).
        - The profile row (if present).
        - The `isInternal` flag is applied outside this function when deriving
          `mustCompleteProfile` (so the profile logic does not need to know about roles).

- **Storage / propagation**
    - The source of truth for the current request is the `authContext` object returned by
      `getAuthContext()`.
    - To keep frontend and backend in sync, extend the Better Auth configuration so that the session
      payload includes:
        - `profileStatus` (same shape as above).
        - Role information (e.g. list of role names) or at least the derived `isInternal` flag.
    - This extended session shape will:
        - Be exposed via the existing `Session`/`User` TypeScript types.
        - Be consumed by `useSession` on the client.
    - The implementation should avoid duplicating completeness logic in the auth config; instead,
      the auth config should delegate to the profile module to compute `profileStatus` when (re)
      building sessions.

### 3.3 Role-aware enforcement wiring

- **Internal/admin exemptions**
    - Centralize the list of internal/admin role names and keep it small and explicit (e.g.
      `['admin', 'staff', …]`).
    - The auth context helper is responsible for setting `isInternal` based on this list.
    - All enforcement-related helpers (layout guards, server action guards, modal triggers) must
      read the same `isInternal` flag and skip enforcement when it is `true`.

- **Backend guard utilities**
    - Build two reusable guard helpers:
        - `requireAuthenticatedUser()`:
            - Uses `getAuthContext()`.
            - Throws or redirects if `session`/`user` is missing.
            - Returns the `authContext` for callers that need it.
        - `requireProfileCompleteUser()`:
            - Calls `requireAuthenticatedUser()`.
            - If `isInternal` is `true`, returns immediately.
            - If `profileStatus.mustCompleteProfile` is `true`, returns a structured error (e.g. a
              discriminated union) or throws a specific error type that callers can map to a
              “profile incomplete” response.
            - Otherwise, returns the same `authContext`.
    - Server actions and API routes that represent “meaningful use of the app” should rely on
      `requireProfileCompleteUser()` instead of doing ad-hoc checks.

### 3.4 Behavior of protected endpoints

- **Layouts / pages**
    - The protected route group layout should continue to:
        - Call `getSession`/`getAuthContext()` to ensure a valid session exists.
        - Redirect unauthenticated users to the localized sign-in route.
    - For authenticated users:
        - The layout should not redirect based on `mustCompleteProfile`; instead, it should make
          `profileStatus` and `isInternal` available to the client-side enforcement boundary (so the
          modal can be shown while the intended page is visible in the background).

- **Server actions & APIs**
    - Server actions that mutate user data or perform core business operations should:
        - Call `requireProfileCompleteUser()` at the top.
        - If the user is incomplete, return a normalized “PROFILE_INCOMPLETE” error (or throw a
          typed error) that client code can interpret as “show/refresh the profile modal”.
    - The profile update action itself:
        - Uses `requireAuthenticatedUser()` (not `requireProfileCompleteUser()`), to allow
          incomplete users to fix their profile.
        - Calls the profile module to upsert the profile.
        - Recomputes `profileStatus` and updates the session via Better Auth’s session update APIs,
          returning the new status to the caller.

---

## 4. Frontend Architecture Overview

### 4.1 Where enforcement happens in the app shell

- **Protected shell**
    - All authenticated sections already share a protected route group layout that:
        - Ensures a valid session exists.
        - Wraps children in a “protected layout wrapper” that renders the navigation bar, sidebar,
          and main content.
    - This protected layout wrapper is the natural home for a **Profile Enforcement Boundary**
      client component that:
        - Is always mounted for authenticated routes.
        - Uses `useSession` to read `user`, `profileStatus`, and `isInternal`.
        - Shows a captive modal when `!isInternal && profileStatus.mustCompleteProfile` is true.

- **Global providers**
    - The root `Providers` component currently only manages theme state; it does not need to know
      about profile enforcement.
    - The Profile Enforcement Boundary should live within the protected shell (not at the global
      root), so that:
        - Public and auth routes remain unaffected.
        - Enforcement is tightly scoped to routes that already depend on authentication.

### 4.2 Consuming backend enforcement state on the client

- **Session-driven UI state**
    - Extend the `useSession` return type so that `data?.user` includes:
        - The derived `profileStatus`.
        - Either `isInternal` or enough role information to compute it in a small helper.
    - The Profile Enforcement Boundary should:
        - Derive `mustCompleteProfile` from these fields.
        - Avoid any client-side heuristics about completeness; all logic is “read-only” over
          backend-provided flags.

- **Initial profile data for the modal**
    - When the modal opens, it should:
        - Use a server action or RSC loader to fetch the current profile data for the user (via the
          profile module).
        - Feed that data into a client-side form component that handles edits.
    - The “submit” path for the modal calls the profile update action, which returns the new
      `profileStatus` so that the modal can close only when the backend agrees it is complete.

### 4.3 Captive modal integration

- **Ownership**
    - The captive profile modal should be owned by the Profile Enforcement Boundary within the
      protected shell, not by individual pages.
    - The modal should be rendered at the shell level (e.g. via a dialog/portal component) so it
      visually and semantically blocks the entire protected area.

- **Show/hide behavior**
    - On every render of a protected route:
        - The boundary checks `useSession().data?.user`.
        - If the user is non-internal and `mustCompleteProfile` is `true`, it opens the modal and
          disables interaction with the underlying content.
        - If the user is internal or `mustCompleteProfile` is `false`, the modal stays closed.
    - The modal should not rely on transient local state for its open/closed status; after a
      full-page navigation or refresh, it should re-open or stay closed based solely on the latest
      session state.

### 4.4 Navigation and intended route handling

- **Recording intended route**
    - The existing i18n utilities already normalize the current pathname to a canonical internal
      path and track route context for message loading.
    - When the Profile Enforcement Boundary first detects `mustCompleteProfile === true` for a given
      request, it should:
        - Treat the current canonical path as the “intended route”.
        - Store it in a lightweight client-side state (e.g. within the boundary component) for the
          duration of the session.
    - For users who were redirected to sign-in from a protected route, sign-in/sign-up flows should:
        - Accept an optional `callbackURL`/equivalent parameter (populated by the proxy when
          redirecting to auth routes).
        - After successful authentication, navigate to that callback path instead of always pushing
          `/dashboard`.

- **Post-completion navigation**
    - After the user successfully submits the profile modal:
        - The profile update action recomputes `profileStatus` and updates the session.
        - The modal closes only when `mustCompleteProfile` becomes `false`.
        - The user remains on their intended route; if the login flow supplied a callback path, they
          should already be on that page when the modal disappears.
    - No additional redirects are required in the common case; the modal simply “unblocks” the page
      that is already loaded.

---

## 5. Data & State Flow (End-to-End)

### 5.1 After login

1. User hits a protected route without a session.
    - The proxy detects a protected canonical path and the absence of a session cookie, and
      redirects to the localized sign-in route (optionally adding a `callbackURL` pointing back to
      the canonical path).
2. User completes sign-in or sign-up.
    - The auth client calls Better Auth; a session is created/updated.
    - The auth configuration or a post-auth hook invokes the profile module and role helper to
      compute `profileStatus` and `isInternal`, baking them into the session payload.
    - The sign-in/up UI navigates to the callback path (if present) or `/dashboard` as a fallback.
3. Protected layout renders the intended route.
    - On the server, the protected layout calls `getAuthContext()`/`getSession` to ensure
      authentication; unauthenticated users are redirected away.
    - For authenticated users, the layout renders the protected shell and the requested page.
4. Profile Enforcement Boundary runs on the client.
    - It calls `useSession` and reads `profileStatus` and `isInternal` from `data.user`.
    - If `!isInternal && profileStatus.mustCompleteProfile`, it opens the modal and blocks
      interaction.

### 5.2 When the user submits a profile update

1. User fills out the profile form in the modal and submits.
    - The modal calls a dedicated profile update server action.
2. Server action processes the update.
    - It calls `requireAuthenticatedUser()` to ensure the user is logged in (but does not enforce
      completeness).
    - It validates the input using the profile module’s schema.
    - It upserts the profile row through the profile repository.
    - It recomputes `profileStatus` via `computeProfileStatus`.
    - It updates the Better Auth session to reflect the new `profileStatus` and role information.
    - It returns the new `profileStatus` in its response.
3. Client updates UI based on backend state.
    - The modal updates its local view based on the returned `profileStatus`.
    - If `mustCompleteProfile` is now `false`, the modal closes; otherwise, it remains open and may
      highlight remaining required fields.
    - A subsequent `useSession` call (or internal subscription) reflects the updated session
      payload, keeping the profile enforcement state consistent.

### 5.3 Already authenticated user hitting the app directly

1. User with an existing session cookie navigates directly to a protected route.
2. The proxy observes the session cookie and allows the request through (no redirect).
3. On the server, the protected layout calls `getAuthContext()`:
    - Better Auth validates the session.
    - The auth context helper loads roles and profile from the database and recomputes
      `profileStatus` and `isInternal` for the current request.
4. The page renders, then the Profile Enforcement Boundary runs on the client:
    - It reads `profileStatus` and `isInternal` from `useSession`.
    - If the user is non-internal and `mustCompleteProfile` is `true` (e.g. new profile requirements
      or an existing user who never created a profile), the modal opens and blocks interaction.

---

## 6. Integration Strategy & Migration Considerations

### 6.1 Incremental rollout plan

1. **Introduce backend primitives**
    - Implement the profile module (schemas, repository, `computeProfileStatus`).
    - Implement the role classification helper and the `getAuthContext()` helper, plus
      `requireAuthenticatedUser()` and `requireProfileCompleteUser()` guards.
    - Extend the session shape to include `profileStatus` and role information, wiring it through
      Better Auth and the auth helpers.
2. **Add profile update path**
    - Implement a server action for upserting profiles that:
        - Uses `requireAuthenticatedUser()`.
        - Returns the recomputed `profileStatus`.
    - Add minimal backend tests around profile completeness and session projection.
3. **Wire frontend enforcement**
    - Implement the Profile Enforcement Boundary in the protected shell, powered by `useSession`.
    - Implement the captive modal UI and connect it to the profile update action.
4. **Enhance login flows**
    - Update the proxy to include a callback path when redirecting to auth routes.
    - Update sign-in/sign-up forms to respect the callback path instead of hard-coding `/dashboard`.

### 6.2 Avoiding breaks to existing flows

- Until the modal and profile update path are in place:
    - `profileStatus` can be computed but not yet enforced (e.g. `mustCompleteProfile` is
      informational).
    - Only once the modal and backend guard are ready should `requireProfileCompleteUser()` be wired
      into critical server actions.
- Protected pages should continue to render as they do today for internal/admin users and for any
  user while enforcement is disabled.
- The `/profile` route remains accessible, and the new modal can either reuse its form components or
  share underlying form logic to avoid duplication.

### 6.3 Handling existing users without profiles

- On first deployment:
    - Many existing users will have a session but no profile row; for them, `hasProfile === false`
      and `mustCompleteProfile === true`.
    - They should encounter the captive modal the next time they visit any protected route (
      including `/dashboard` and `/settings`).
- To avoid locking users out permanently:
    - The profile update action must be robust and tolerant of partial existing data.
    - Internal/admin users should be explicitly exempt via `isInternal` while the team stabilizes
      the new flow.
- Over time, once adoption is high:
    - The team can consider making more server actions depend strictly on
      `requireProfileCompleteUser()`.

### 6.4 Risks and mitigations

- **Overly strict completeness rules**
    - Risk: Users are blocked due to aggressive required-field choices.
    - Mitigation: Start with a minimal required set in `computeProfileStatus` and expand
      iteratively.

- **Misclassified internal roles**
    - Risk: Internal users get blocked by the captive modal, impacting operational workflows.
    - Mitigation: Keep the internal role list small and well-documented; add logging when
      `isInternal` is computed so issues are visible early.

- **Desynchronization between session and database**
    - Risk: Profile is updated but `profileStatus` in the session is stale.
    - Mitigation: Always recompute `profileStatus` and update the session in the profile update
      action; keep all other paths read-only with respect to profile enforcement.

---

## 7. Constraints for the Implementer

- **Follow this architecture**
    - Use the profile module and auth context helper as the single source of truth for profile
      completeness and enforcement flags.
    - Do not scatter ad-hoc profile checks across pages or server actions; use
      `requireAuthenticatedUser()`/`requireProfileCompleteUser()` and the shared `profileStatus`.

- **Backend-first enforcement**
    - All enforcement decisions must originate on the backend (profile service + role helper + auth
      context).
    - The frontend must only consume `profileStatus` and `isInternal` via `useSession`, server
      actions, or RSC data; it must not re-implement completeness rules.

- **Role-aware exemptions**
    - Respect the centralized internal/admin role list when computing `isInternal`.
    - Ensure internal/admin users are exempt from profile enforcement unless and until product
      explicitly changes this requirement.

- **Respect existing conventions**
    - Mirror the existing module organization (e.g. contact-submission and auth modules) when adding
      the profile module and auth context utilities.
    - Use the existing i18n navigation utilities for all redirects and “intended route” handling.
    - Keep new types aligned with the existing `Session`/`User` type exports from the auth module.

- **Local implementation freedom**
    - You are free to choose the exact modal UI, form layout, and internal helper function shapes as
      long as:
        - The captive modal is mounted at the protected shell level and blocks interaction for
          incomplete, non-internal users.
        - Backend helpers remain the single source of truth for `profileStatus` and `isInternal`.
        - Sign-in/sign-up flows integrate with the callback/intended-route pattern described above.

