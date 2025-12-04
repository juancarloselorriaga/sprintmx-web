• 1. Title

  Refactor Plan: Internal Users Admin Screen (Server‑Driven Table, Dialog-Based Create/Delete)

  ———

  2. Executive Summary

  - Convert the Internal Users admin page into a server-driven, URL-synced table for all sorting, filtering, and pagination, while keeping
    only “Create” and “Delete” flows client-side via existing Dialog patterns.
  - Replace the large inline “Create internal account” card with a focused “Create internal user” dialog triggered from a primary action above
    the table, freeing layout space and clarifying hierarchy.
  - Consolidate filters into a compact filter bar (search + role pills), remove unclear legend chips, and introduce a clear empty state that
    distinguishes “no users yet” from “no results for filters”.
  - Add a per-row actions menu with a delete confirmation dialog, ensure soft-deleted users don’t appear in the list, and align all styling
    with existing bg-card, muted, primary, and destructive theme tokens.

  ———

  3. Refactor Plan

  1. UX Redesign Decisions

  - Overall layout
      - Replace the current lg:grid-cols-[420px,1fr] two-column layout in components/admin/users/admin-users-client.tsx with a single-column
        flow:
          - Page header (section label, title, description, “Signed in as …”).
          - Toolbar row (search + role filters + display controls).
          - Table (with inline empty state / results).
      - Justification: makes the user list the primary focus, aligns with other admin pages using card + header patterns, and avoids the
        create form visually competing with the table.
  - Create User flow
      - Move the existing CreateInternalUserForm into a Dialog‑based flow (@/components/ui/dialog), following the pattern in components/
        layout/navigation/feedback-dialog.tsx.
      - Entry point:
          - Add a primary Button “Create internal user” in the top-right of the header/toolbar area (visible at all times).
          - Also surface the same action in the empty state CTA when there are no users.
      - Dialog content:
          - Reuse the existing form fields (role toggle Admin/Staff, name, email, temporary password) and validation logic.
          - Keep the role summary section but compress copy to fit better in a modal; keep the same theme tokens (bg-muted/40, border-
            primary/40, bg-primary/5, etc.).
      - Behavior:
          - On submit, call createAdminUser or createStaffUser (unchanged contract).
          - On success: show a sonner toast (as today), close dialog, reset form, and trigger a server re-fetch (router.refresh() from the
            dialog component) instead of mutating local users state.
      - Justification: dialog is consistent with the FeedbackDialog pattern, preserves context (user stays on list), and removes the
        heavyweight inline card that currently dominates the screen.
  - Filters & search UX
      - Replace the current inline filters (role buttons + two separate name/email inputs) with a unified filter bar above the table:
          - Left: single search input labeled “Search by name or email”.
              - Uses existing input styles (rounded border, bg-background, focus-visible:ring-ring/30).
              - Placeholder: “Search by name or email”.
          - Right: role pill group (All, Admin, Staff) implemented as small Buttons, visually grouped.
          - Optionally, group non-data filters (density, column visibility) on the far right under a “Display” control (see below).
      - Application model:
          - Search is submit-on-apply:
              - Encapsulate search input in a small <form>; pressing Enter or clicking a small “Apply” icon/button updates the URL (?
                search=...) and triggers a server re-render.
              - No per-keystroke navigation; this avoids network thrash and keeps the UX snappy even as data grows.
          - Role pills:
              - Clicking All/Admin/Staff updates the role query param (role=all|admin|staff) via link navigation and reloads data from the
                server.
      - Justification:
          - The current client-side filtering leads to perceived freezing; moving the entire filter system to URL + server avoids heavy client
            work.
          - A single search field is cognitively simpler than two separate name/email fields.
  - Sorting UX
      - Keep clickable header sort for at least Name, Internal role, and Created columns.
      - Use the existing arrow indicators (↑ / ↓), but base them on sort + dir values derived from the URL, not client-side SortingState.
      - Behavior:
          - First click sets sort to the column and dir=asc (or desc for Created by default).
          - Subsequent click toggles direction.
          - Sorting updates URL params and refreshes data from the server.
      - Justification: matches current expectations (clickable headers) but puts the logic on the server, enabling consistent pagination and
        stable result ordering.
  - Density behavior
      - Keep the existing comfortable / compact density toggle, but explicitly scope it to purely presentational client state:
          - Use two small buttons labeled “Comfortable” and “Compact” in a “Display” section on the right side of the toolbar.
          - Only adjust vertical padding (py-2 vs py-3) and possibly font size or row height in the table.
          - Optionally persist the density choice to localStorage under a dedicated key (e.g., adminUsers.tableDensity) so user preference
            is remembered.
      - No URL or server coupling for density.
      - Justification: keeps display preferences fast and local, while leaving data logic server-driven.
  - Column visibility (“Show columns”)
      - Replace the current row of “Show columns” toggle buttons (which uses columnVisibility state but is disconnected from useReactTable)
        with a small “Columns” dropdown:
          - Use DropdownMenu from components/ui/dropdown-menu.tsx.
          - Items: checkboxes for Internal role, Permissions, Created, Actions.
      - Behavior:
          - Toggle values stored in local state in the table component.
          - Conditionally render each column based on this state (rather than via TanStack’s column visibility).
      - Justification: fixes broken behavior, uses existing dropdown component, and keeps a familiar “Columns” pattern for admins.
  - Legend / “Admin / Permissions enabled/disabled” chips
      - Remove the legend row that currently shows small colored dots for “Admin”, “Permissions enabled”, and “Permissions disabled”.
      - Rely on:
          - The Internal role chips (already show “admin”, “staff”).
          - The PermissionBadge labels (Admin area, Manage users, Staff tools) with tooltips for explanation.
      - Justification: the legend isn’t interactive, duplicates information in a less clear form, and contributes to visual clutter.
  - Delete action & confirmation
      - Add a real Actions menu per row:
          - Replace the disabled “Actions” button with a DropdownMenuTrigger (same button style) that opens a menu with at least a “Delete
            user” item.
          - Use the variant="destructive" style on the delete menu item.
      - When “Delete user” is selected:
          - Open a Dialog (same Dialog pattern as feedback) that:
              - Shows the user’s name/email.
              - Explains that the internal account will be deactivated / removed from internal access.
              - Requires explicit confirm via a destructive Button (“Delete user”).
          - On confirm:
              - Call a new server action (see data plan) to soft-delete the user.
              - On success: toast “User deleted”, close dialog, and refresh the table via server (router.refresh()).
              - On error: show explicit banner/toast with reason (e.g., cannot delete yourself).
      - Justification: provides a safe, predictable flow and matches other modal patterns in the app.
  - Empty state UX
      - Distinguish between:
          - No internal users at all (total === 0):
              - Show a dedicated UsersEmptyState card in place of the table.
              - Content: icon (e.g., Shield), title “No internal users yet”, supporting text explaining internal admins/staff, and a primary
                button “Create first admin” that opens the create dialog.
          - No results for current filters (total > 0 but current page/filters yield zero rows):
              - Keep the table shell, but show a friendly message in the table body:
                  - Title: “No users match your filters”.
                  - Subtext: “Try adjusting your search or clearing filters.”
                  - Add a “Clear filters” button that resets search and role in the URL.
      - Justification: separates the bootstrapping case from everyday filtering use, and gives clear guidance + action in each scenario.

  ———

  2. Data Architecture Plan

  - Server-side list query shape
      - Introduce a typed input for listing internal users, e.g. AdminUsersQuery:
          - page: number (1-based; default 1).
          - pageSize: number (default 20; not exposed as UI for now).
          - sortBy: 'createdAt' | 'name' | 'email' | 'role' (default 'createdAt').
          - sortDir: 'asc' | 'desc' (default 'desc' for createdAt, 'asc' otherwise).
          - role: 'all' | 'admin' | 'staff' (default 'all').
          - search: string (default '').
      - Define a corresponding success payload type:
          - users: AdminUserRow[] (unchanged row shape).
          - page: number.
          - pageSize: number.
          - total: number (total count of internal users matching filters).
          - pageCount: number (computed from total and pageSize).
  - Refactor listInternalUsers
      - Change app/actions/admin-users-list.ts to accept a query input and return metadata:
          - Signature: listInternalUsers(query?: AdminUsersQuery): Promise<ListInternalUsersResult>.
          - Keep the same withAdminUser guard pattern and error shapes (UNAUTHENTICATED, FORBIDDEN, SERVER_ERROR).
      - Query behavior:
          - Base filter:
              - Only include users that:
                  - Have at least one role in INTERNAL_ROLE_NAMES = ['admin', 'staff'].
                  - Have users.deletedAt IS NULL (exclude soft-deleted).
              - Preserve the call to getUserRolesWithInternalFlag and retain the isInternal check; filter out non-internal results as today.
          - Role filter:
              - If role === 'admin', restrict to roles.name = 'admin'.
              - If role === 'staff', restrict to roles.name = 'staff'.
              - If role === 'all', keep the existing inArray(roles.name, INTERNAL_ROLE_NAMES).
          - Search filter:
              - If search is non-empty, apply a case-insensitive “contains” filter on both users.name and users.email.
              - Implementation detail: use ILIKE (Postgres) or lowercased LIKE equivalent via Drizzle.
              - Operator semantics: contains substring, case-insensitive.
          - Sorting:
              - Map sortBy to DB columns:
                  - 'name' → users.name.
                  - 'email' → users.email.
                  - 'role' → a stable derived sort (e.g., roles.name or first canonical role).
                  - 'createdAt' → users.createdAt.
              - Apply orderBy(column, direction) using sortDir.
              - Remove the client-side internalUsers.sort(...) call; sorting lives only in the DB.
          - Pagination:
              - Apply limit(pageSize) and offset((page - 1) * pageSize) after filters and ordering.
          - Total count:
              - Run a separate count query with the same filters (excluding limit/offset) to compute total and pageCount.
      - Adjust the return type:
          - Maintain backward compatibility by:
              - Either making query optional and using default values when called without arguments.
              - Or introducing a new action (e.g., listInternalUsersPage) and gradually migrating callers/tests.
          - Update the tests in __tests__/actions/admin-users-list.server.test.ts to:
              - Pass a minimal query object where relevant.
              - Assert that total and pagination metadata are returned for the happy-path case.
  - URL sync strategy
      - Define URL params for the admin users page (/admin/users):
          - page → 1-based integer; default 1.
          - role → 'all' | 'admin' | 'staff'; default 'all'.
          - search → arbitrary string; default empty.
          - sort → 'createdAt' | 'name' | 'email' | 'role'; default 'createdAt'.
          - dir → 'asc' | 'desc'; default 'desc' for createdAt.
      - Pattern:
          - Example: /admin/users?page=2&role=admin&search=john&sort=name&dir=asc.
      - Parsing:
          - Update app/[locale]/(admin)/admin/users/page.tsx to accept searchParams (following the sign-in page pattern).
          - Normalize values with safe defaults (clamp page ≥ 1, ignore invalid sort/dir to defaults).
      - Serialization:
          - Toolbar, header sorts, and pagination controls build URLs by merging existing searchParams with the changed key(s).
          - Prefer Link components for navigation to keep SSR semantics and avoid manual query string construction where possible.
  - Server vs client responsibilities
      - Server-only:
          - Applying filters, search, sort, and pagination (via listInternalUsers).
          - Checking auth and permissions (withAdminUser, getAuthContext).
          - Computing total and pageCount.
      - Client-only:
          - Dialog open/close and form state for create and delete.
          - Density and column visibility state.
          - Triggering URL changes (via Link or router.push/replace) and router.refresh() after mutations.
  - Pagination reuse
      - Introduce a pagination-specific prop contract for the admin users table:
          - { page, pageCount, total, pageSize, basePath, filters }.
      - Implement UsersTablePagination as a generic-enough client component in components/admin/users:
          - Renders “Showing X–Y of Z users”.
          - Renders “Previous” / “Next” links that update page in the URL while preserving other params.
      - Keep it scoped to the Admin Users module for now; if a second table with similar requirements emerges, extract to a shared components/
        common/table-pagination.tsx using the same API.
  - Delete server action
      - Add a dedicated delete action in app/actions/admin-users-delete.ts (or augment admin-users.ts if preferred, but keep responsibilities
        clear):
          - Input: { userId: string }.
          - Wrap with withAdminUser guard.
          - Behavior:
              - Reject if attempting to delete the currently authenticated user.
              - Soft-delete the user by setting users.deletedAt (and optionally related rows like accounts.deletedAt, sessions.deletedAt if
                continuity is desired).
              - Ensure listInternalUsers excludes soft-deleted users.
          - Return type:
              - Success: { ok: true }.
              - Errors: { ok: false; error: 'UNAUTHENTICATED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CANNOT_DELETE_SELF' | 'SERVER_ERROR' }.

  ———

  3. Component Architecture Plan

  - Page-level components
      - app/[locale]/(admin)/admin/users/page.tsx (server)
          - Responsibilities:
              - Configure locale via configPageLocale(params, { pathname: '/admin/users' }).
              - Authorize user via getAuthContext() (if needed for header info).
              - Parse searchParams into AdminUsersQuery.
              - Call listInternalUsers(query) and handle errors.
              - Serialize AdminUserRow[] for client (convert createdAt to string).
              - Pass { initialUsers, initialError, paginationMeta, initialQuery } to client component.
          - Sorting/filter decisions and defaults are computed here.
      - components/admin/users/admin-users-client.tsx (client)
          - Keep as the main client shell but simplify responsibilities:
              - Accept props:
                  - initialUsers: SerializedAdminUserRow[].
                  - initialError (auth/server errors).
                  - query (role, search, sort, dir, page).
                  - paginationMeta (page, pageSize, total, pageCount).
              - Deserialize createdAt back into Date (deserializeUsers kept here or in a util).
              - Render:
                  - Page header (Admin label, title, description, signed-in email).
                  - Optional banner (existing Banner pattern reused).
                  - UserCreateDialog trigger.
                  - UsersTable with users, query, and pagination props.
              - Remove local users array as data source for filtering/pagination; use only props from server.
              - After create/delete, rely on router.refresh() (triggered by child components) rather than mutating local users.
  - Create user components
      - components/admin/users/user-create-dialog.tsx (client)
          - Wraps Dialog, DialogTrigger, DialogContent from components/ui/dialog.
          - Contains the existing CreateInternalUserForm logic:
              - Role selection (internal.admin vs internal.staff).
              - Field inputs (name, email, password).
              - Validation mapping (extractValidationMessages, extractFieldErrors).
              - Server action calls to createAdminUser / createStaffUser.
              - Banners/toasts on error and success.
          - Exposes:
              - Props for initial role (optional).
              - onSuccess?: () => void to allow parent to trigger router.refresh().
  - Table & toolbar components
      - components/admin/users/users-table.tsx (client)
          - Replace the current TanStack-driven implementation with a simpler, server-driven table.
          - Inputs:
              - users: AdminUserRow[].
              - query: AdminUsersQuery (or a narrower view model: { role, search, sortBy, sortDir }).
              - paginationMeta: { page, pageSize, total, pageCount }.
          - Responsibilities:
              - Render table header and rows based on users.
              - Delegate:
                  - Toolbar to UsersTableToolbar.
                  - Row actions to UsersTableActions / DeleteUserDialog.
                  - Pagination to UsersTablePagination.
              - Keep density and column visibility state local to this component.
              - Implement the internal PermissionBadge either inline or via a small extracted helper.
      - components/admin/users/users-table-toolbar.tsx (client)
          - Renders:
              - Heading (“Internal users”) and short description.
              - Search form (single input).
              - Role filter buttons (All, Admin, Staff).
              - “Display” controls (density toggle, “Columns” dropdown).
          - Uses:
              - useRouter + useSearchParams from Next’s client APIs to update URL (or Links for simple cases).
          - Behavior:
              - On search submit: replace search query param, reset page to 1.
              - On role button click: set role, reset page to 1.
              - On “Clear filters”: drop search + role and set page=1.
      - components/admin/users/users-table-pagination.tsx (client)
          - Inputs: { page, pageCount, total, pageSize }.
          - Renders:
              - “Showing X–Y of Z users” text (logic moved from current users-table.tsx).
              - Previous/Next buttons using Button with ChevronLeft / ChevronRight.
          - Behavior:
              - Compute target page values and update URL with preserved filters/sort.
      - components/admin/users/users-table-actions.tsx (client)
          - Renders the “Actions” cell:
              - Uses DropdownMenu, DropdownMenuTrigger, and DropdownMenuItem (with variant="destructive" for delete).
              - Wraps DeleteUserDialog or controls its open state.
          - Inputs:
              - userId, userName, userEmail, plus a flag for whether delete is allowed (e.g., preventing self-delete).
          - On delete confirmation:
              - Call new deleteInternalUser action.
              - Show toast on success/failure.
              - On success, trigger router.refresh().
  - Empty state & helpers
      - components/admin/users/users-empty-state.tsx (server or client)
          - Stateless presentational component used when total === 0.
          - Accepts a render prop or child for the “Create first admin” button, so the client UserCreateDialog can be composed in.
      - PermissionBadge extraction:
          - Optional: move the inline PermissionBadge component from users-table.tsx into a small components/admin/users/users-permission-
            badge.tsx, preserving current tooltip behavior and theme tokens.
  - Client vs server classification
      - Server:
          - page.tsx (admin users route).
          - users-empty-state.tsx (if kept purely view-only and composed with client triggers).
      - Client:
          - admin-users-client.tsx.
          - user-create-dialog.tsx.
          - users-table.tsx.
          - users-table-toolbar.tsx.
          - users-table-pagination.tsx.
          - users-table-actions.tsx.
          - user-delete-dialog.tsx (if implemented as a separate component).

  ———

  4. File Structure Plan

  Aligning with the existing structure (app/[locale]/(admin)/admin/users and components/admin/users), the target tree:

  - app/[locale]/(admin)/admin/users/
      - page.tsx
          - Server page: parses searchParams, calls listInternalUsers(query), passes props down.
  - app/actions/
      - admin-users-list.ts
          - Updated listInternalUsers(query?: AdminUsersQuery) with pagination/filter/sort, returns { users, page, pageSize, total,
            pageCount } on success.
      - admin-users.ts
          - Unchanged create actions; optional home for delete if you choose to group internal user mutations.
      - admin-users-delete.ts (new, if not co-locating with admin-users.ts)
          - deleteInternalUser action with withAdminUser guard.
  - components/admin/users/
      - admin-users-client.tsx
          - Client shell orchestrating header, banner, create dialog trigger, and table.
      - user-create-dialog.tsx
          - Dialog wrapper + CreateInternalUserForm logic (moved from current file).
      - users-table.tsx
          - Server-driven table component: renders table, delegates toolbar/pagination/actions, holds density/column visibility.
      - users-table-toolbar.tsx
          - Filter/search/role/density/columns bar.
      - users-table-pagination.tsx
          - Pagination controls (“Showing X–Y of Z users”, Prev/Next).
      - users-table-actions.tsx
          - Per-row actions, including delete trigger.
      - user-delete-dialog.tsx
          - Dialog for confirming deletion, calling deleteInternalUser.
      - users-empty-state.tsx
          - Empty-state card for the “no users” scenario.
      - users-permission-badge.tsx (optional)
          - Extracted PermissionBadge to keep users-table.tsx focused.

  ———

  5. Migration Steps (Phased Plan)

  - Phase 1 — Data layer and server actions
      - Extend listInternalUsers to accept AdminUsersQuery and return pagination metadata.
      - Implement filtering by role, search, and deletedAt IS NULL, plus server-side sort and pagination.
      - Update admin-users-list tests to reflect the new signature and ensure existing error cases still behave correctly.
      - Add deleteInternalUser server action with proper auth checks and soft-delete behavior.
  - Phase 2 — Wire server data into the page
      - Update app/[locale]/(admin)/admin/users/page.tsx to:
          - Accept searchParams (similar pattern to the sign-in page).
          - Normalize them into AdminUsersQuery with defaults.
          - Call listInternalUsers(query) and serialize results for the client.
      - Pass initialUsers, initialError, and paginationMeta into AdminUsersClient.
  - Phase 3 — Restructure client container and table
      - Refactor components/admin/users/admin-users-client.tsx to:
          - Stop owning users state as the canonical source (remove sortedUsers memo based on client sorting).
          - Accept users and paginationMeta purely from props.
          - Keep banner and session email display.
      - Replace AdminUsersTable’s TanStack configuration with a simpler, server-driven table implementation:
          - Remove useReactTable, ColumnFiltersState, SortingState, and pagination state.
          - Use props (query, paginationMeta) to drive header sort UI and pagination.
  - Phase 4 — Build filter bar & display controls
      - Implement UsersTableToolbar:
          - Add unified search input, role pills, density toggle, and “Columns” dropdown.
          - Use router.push/replace or Link to update query params and reset page on filter changes.
      - Remove existing separate Filter by name/email text inputs and the broken “Show columns” row.
      - Validate that filter interactions always re-render data via server (no local filtering).
  - Phase 5 — Create User dialog flow
      - Extract the CreateInternalUserForm into user-create-dialog.tsx and mount it:
          - From the page header as “Create internal user” primary button.
          - In the empty state CTA.
      - On successful creation:
          - Close dialog.
          - Reset form state.
          - Trigger router.refresh() to reload the table from server.
  - Phase 6 — Delete User flow
      - Implement UsersTableActions and user-delete-dialog.tsx:
          - Replace the disabled “Actions” button with a dropdown menu.
          - Wire “Delete user” to open the confirmation dialog.
          - Connect dialog confirm to deleteInternalUser.
          - On success: toast + router.refresh().
      - Ensure you cannot delete yourself; surface appropriate error messages if attempted.
  - Phase 7 — Empty state & cleanup
      - Add UsersEmptyState:
          - Use it in the total === 0 scenario in place of the table.
          - Hook its CTA into the UserCreateDialog.
      - Adjust the in-table empty state to the “no results for filters” message and add “Clear filters”.
      - Remove the “Admin / Permissions enabled/disabled” legend chips and any dead UI hooks.
      - Confirm all new UI respects existing tokens and spacing (bg-card, border, muted, primary, destructive, etc.).
  - Phase 8 — QA, accessibility, and SSR checks
      - Verify:
          - All interactions (filters, sort, pagination) trigger server re-renders, not local data manipulation.
          - Dialogs are keyboard-accessible (focus management consistent with existing Dialog usage).
          - Colors and typography remain readable in dark mode.
      - Run and update relevant Jest tests (especially around listInternalUsers and any new server actions).
      - Confirm that the page still renders correctly on first SSR load without client JS.

  ———

  6. Acceptance Criteria

  - Data & performance
      - No client-side filtering, sorting, or pagination logic remains; all are applied in listInternalUsers using DB queries.
      - listInternalUsers supports role, search, sort, and pagination; tests cover success and error paths.
      - The deleteInternalUser action soft-deletes users and prevents self-delete.
  - URL & navigation
      - page, role, search, sort, and dir are fully encoded in the URL and control the table contents.
      - Changing filters, sort, or page updates the URL and triggers a server-driven re-render.
      - Hitting refresh or sharing the URL yields the same table state.
  - Create & delete flows
      - “Create internal user” opens a dialog using the existing Dialog pattern.
      - Successful creation closes the dialog, resets the form, shows a toast, and the new user appears in the table (via server refresh).
      - Each row has an “Actions” menu with a working delete option that opens a confirmation dialog.
      - Confirming delete removes the user from the list after server refresh and shows a toast.
  - UX & layout
      - The large inline “Create internal account” card is removed from the main layout; the table occupies the full width.
      - Filters are consolidated into a single toolbar with a unified search input and role pills.
      - The “Show columns” controls correctly toggle visibility of role, permissions, created, and actions columns.
      - Density toggle reliably switches between comfortable and compact row spacing without affecting data.
  - Empty states & clarity
      - When there are no internal users, a dedicated empty state card is shown with a CTA to create the first admin.
      - When filters yield no results, the table shows a “No users match your filters” message and a “Clear filters” action.
      - The “Permissions enabled/disabled” legend chips are removed; permission information is communicated via PermissionBadge labels and
        tooltips.
  - Styling & accessibility
      - All colors and typography use existing theme tokens and Tailwind utility classes already present in the repo; no arbitrary hex or new
        color names.
      - New dialogs, buttons, and menus follow the established patterns in components/ui/dialog and components/ui/dropdown-menu.
      - Keyboard navigation works for filters, table actions, and dialogs (focus trapping, escape to close).
      - The page renders correctly in both light and dark modes.

  ———

  4. Final Checklist

  - [ ] listInternalUsers refactored to accept AdminUsersQuery and return { users, page, pageSize, total, pageCount } with all filters applied
    in SQL.
  - [ ] deleteInternalUser server action implemented with self-delete prevention and soft-delete semantics.
  - [ ] page.tsx updated to parse searchParams, call listInternalUsers(query), and pass results to AdminUsersClient.
  - [ ] AdminUsersClient updated to treat server-provided users as the single source of truth; no client-side sorting/filtering/pagination.
  - [ ] AdminUsersTable simplified to a server-driven table with a new UsersTableToolbar, UsersTablePagination, and UsersTableActions.
  - [ ] Filter bar implemented: single search input, role pills, density toggle, and working column visibility dropdown.
  - [ ] “Create internal user” dialog implemented (reusing existing form logic) and wired to refresh data on success.
  - [ ] Row-level delete confirmation dialog implemented, calling deleteInternalUser and refreshing data on success.
  - [ ] Empty states implemented for both “no users at all” and “no results for current filters”, with CTAs wired to the create dialog and
    clear-filters behavior.
  - [ ] Old “Create internal account” card, broken “Show columns” row, and “Admin / Permissions enabled/disabled” legend removed.
  - [ ] Tests for admin-users-list and any new actions updated/passing; manual QA confirms SSR rendering, URL sync, and accessibility.
