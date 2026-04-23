# Implementation Plan: Flow Master React Frontend

## Overview

Implement the Flow Master React SPA using Vite + React 18 + TypeScript, with React Router v6 for routing, TanStack Query v5 for server state, Zustand for client state, Axios for HTTP, and Tailwind CSS for styling. The app is deployed as a static bundle served by an Express server on Heroku.

## Tasks

- [x] 1. Scaffold project and configure tooling
  - Initialise a new Vite + React + TypeScript project in `flow-master-react/`
  - Install dependencies: `react-router-dom`, `@tanstack/react-query`, `zustand`, `axios`, `tailwindcss`, `postcss`, `autoprefixer`, `fast-check`, `vitest`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `express`
  - Configure Tailwind CSS (`tailwind.config.js`, `postcss.config.js`, import in `src/index.css`)
  - Configure Vitest in `vite.config.ts` (jsdom environment, setupFiles for jest-dom matchers)
  - Create `src/types/index.ts` with all shared TypeScript interfaces (`AuthResponse`, `Period`, `Income`, `Expense`, `ExpenseCategory`, `PaymentSource`, `User`, `Notification`)
  - _Requirements: 14.1_

- [x] 2. Implement Zustand stores
  - [x] 2.1 Create `src/store/authStore.ts`
    - Implement `AuthState` with `token`, `setToken`, `clearToken`
    - Use Zustand `persist` middleware with `localStorage`
    - _Requirements: 1.3, 2.2, 2.3_

  - [x] 2.2 Create `src/store/notificationStore.ts`
    - Implement `NotificationState` with `notifications`, `add`, `dismiss`
    - Generate UUID for each notification `id`
    - _Requirements: 15.1, 15.2, 15.3_

- [x] 3. Implement API layer
  - [x] 3.1 Create `src/api/client.ts`
    - Configure Axios instance with `baseURL: import.meta.env.VITE_API_BASE_URL`
    - Add request interceptor to attach `Authorization: Bearer <token>` from auth store
    - Add response interceptor to handle 401: clear token and redirect to `/login`
    - _Requirements: 1.6, 2.2_

  - [x] 3.2 Write property test for Bearer token attachment (Property 1)
    - **Property 1: Bearer token present on all authenticated requests**
    - **Validates: Requirements 1.6**

  - [x] 3.3 Write property test for 401 clears token (Property 3)
    - **Property 3: 401 response always clears token**
    - **Validates: Requirements 2.2**

  - [x] 3.4 Create `src/api/auth.ts`
    - Implement `login(username, password)` — POST to `auth/login`, return `AuthResponse`
    - _Requirements: 1.2, 1.3_

  - [x] 3.5 Create `src/api/periods.ts`
    - Implement `useCurrentPeriod()` — `useQuery` for current period
    - Implement `useActivePeriods()` — `useQuery` for all active periods with nested incomes/expenses
    - Implement `useGeneratePeriods()` — `useMutation` for POST to generate periods endpoint
    - Export `queryKeys` object with all query key constants
    - _Requirements: 3.3, 6.3, 7.2_

  - [x] 3.6 Create `src/api/incomes.ts`
    - Implement `useUpcomingIncomes()` — `useQuery` for incomes in next 3 days
    - _Requirements: 3.3, 5.1_

  - [x] 3.7 Create `src/api/expenses.ts`
    - Implement `useUpcomingExpenses()` — `useQuery` for expenses in next 3 days
    - _Requirements: 3.3, 5.2_

  - [x] 3.8 Create `src/api/admin.ts`
    - Implement `useExpenseCategories()`, `useUpdateExpenseCategory()` mutation
    - Implement `usePaymentSources()`, `useUpdatePaymentSource()` mutation
    - Implement `useUsers()`, `useUpdateUser()` mutation
    - All update mutations use TanStack Query optimistic update pattern (`onMutate`/`onError` rollback)
    - _Requirements: 10.2, 10.3, 10.4, 10.5, 11.1, 11.2, 11.3, 11.4, 12.1, 12.2, 12.3, 12.4_

- [-] 4. Implement utility functions
  - [x] 4.1 Create `src/utils/dateUtils.ts`
    - Implement `formatDate(dateStr: string): string` — formats ISO 8601 to `MMM D, YYYY`
    - Implement `isWithinNextDays(dateStr: string, days: number): boolean` — checks if date falls within [today, today + days] inclusive
    - _Requirements: 4.1, 5.1, 5.2_

  - [x] 4.2 Write property test for date formatting (Property 5)
    - **Property 5: Period date formatting**
    - **Validates: Requirements 4.1**

  - [x] 4.3 Write property test for upcoming income filter (Property 6)
    - **Property 6: Upcoming income filter correctness**
    - **Validates: Requirements 5.1**

  - [x] 4.4 Write property test for upcoming expense filter (Property 7)
    - **Property 7: Upcoming expense filter correctness**
    - **Validates: Requirements 5.2**

- [x] 5. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement common components
  - [x] 6.1 Create `src/components/common/LoadingSpinner.tsx`
    - Simple animated spinner component
    - _Requirements: 3.4, 7.5_

  - [x] 6.2 Create `src/components/common/NotificationBanner.tsx`
    - Reads from `notificationStore`
    - Renders each notification with a dismiss (`×`) button
    - Fixed position (top-right) so it appears consistently on all screens
    - _Requirements: 15.1, 15.2, 15.3, 15.4_

  - [x] 6.3 Write property test for notification dismiss mechanism (Property 21)
    - **Property 21: Every notification has a dismiss mechanism**
    - **Validates: Requirements 15.3**

  - [x] 6.4 Write property test for notification location consistency (Property 22)
    - **Property 22: Notification location is consistent across screens**
    - **Validates: Requirements 15.4**

  - [x] 6.5 Create `src/components/common/ProtectedRoute.tsx`
    - Reads token from `useAuthStore`; renders `<Outlet />` if present, else `<Navigate to="/login" replace />`
    - _Requirements: 2.1_

  - [x] 6.6 Write property test for unauthenticated navigation redirect (Property 2)
    - **Property 2: Unauthenticated navigation always redirects to login**
    - **Validates: Requirements 2.1**

- [x] 7. Implement layout components
  - [x] 7.1 Create `src/components/layout/NavBar.tsx`
    - Links to `/` (Dashboard), `/periods` (Periods), `/admin` (Admin) using `<NavLink>` with active styling
    - Logout button: calls `authStore.clearToken()` then navigates to `/login`
    - _Requirements: 13.1, 13.2, 13.3_

  - [x] 7.2 Write property test for active route link highlighting (Property 18)
    - **Property 18: Active route navigation link is highlighted**
    - **Validates: Requirements 13.2**

  - [x] 7.3 Create `src/components/layout/AppShell.tsx`
    - Renders `<NavBar />`, `<NotificationBanner />`, and `<Outlet />`
    - _Requirements: 13.1, 15.4_

- [x] 8. Implement LoginPage
  - [x] 8.1 Create `src/pages/LoginPage.tsx`
    - Controlled form with `username` and `password` fields
    - On submit: calls `login()`, stores token via `authStore.setToken()`, navigates to `/`
    - On error: adds notification via `notificationStore.add()`, preserves username field
    - Disables submit button while request is in-flight
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 8.2 Write unit tests for LoginPage
    - Test form submission, error notification display, button disabled state, username preserved on error
    - _Requirements: 1.1, 1.4, 1.5_

- [x] 9. Implement DashboardPage and CreatePeriodsModal
  - [x] 9.1 Create `src/components/modals/CreatePeriodsModal.tsx`
    - Numeric input for count (1–12), validates integer range before enabling submit
    - On submit: calls `useGeneratePeriods` mutation; disables submit while pending
    - On success: closes modal, invalidates Dashboard queries
    - On error: shows notification inside modal, keeps modal open
    - On dismiss without submit: closes modal without API call
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

  - [x] 9.2 Write property test for modal input validation (Property 10)
    - **Property 10: Period modal input validation**
    - **Validates: Requirements 6.8**

  - [x] 9.3 Create `src/pages/DashboardPage.tsx`
    - Calls `useCurrentPeriod()`, `useUpcomingIncomes()`, `useUpcomingExpenses()` concurrently
    - Shows `<LoadingSpinner />` per section while loading
    - Uses `useEffect` on `isError` to push notifications to `notificationStore`
    - Displays current period date range formatted as `MMM D, YYYY`; shows "no active period" message if absent
    - Displays upcoming incomes list (name + scheduled date) with empty state message
    - Displays upcoming expenses list (name + due date) with empty state message
    - "Create Periods" button opens `<CreatePeriodsModal />`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1_

  - [x] 9.4 Write property test for dashboard fetch failure notification (Property 4)
    - **Property 4: Dashboard fetch failure always produces a notification**
    - **Validates: Requirements 3.5**

  - [x] 9.5 Write property test for income entry rendering completeness (Property 8)
    - **Property 8: Income entry rendering completeness**
    - **Validates: Requirements 5.5**

  - [x] 9.6 Write property test for expense entry rendering completeness on Dashboard (Property 9)
    - **Property 9: Expense entry rendering completeness (Dashboard)**
    - **Validates: Requirements 5.6**

- [x] 10. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement PeriodsPage
  - [x] 11.1 Create `src/pages/PeriodsPage.tsx`
    - Calls `useActivePeriods()`; shows `<LoadingSpinner />` while loading
    - On error: pushes notification to `notificationStore`
    - Shows "no active periods" message when list is empty
    - Renders horizontally scrollable container (`overflow-x: auto`)
    - Sorts periods ascending by `startDate` client-side before rendering
    - Renders a `PeriodColumn` for each period
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [x] 11.2 Write property test for period column ordering (Property 11)
    - **Property 11: Period column ordering**
    - **Validates: Requirements 7.3**

  - [x] 11.3 Create `PeriodColumn` component (co-located in `src/pages/PeriodsPage.tsx` or `src/components/`)
    - Props: `period: Period` (with `incomes: Income[]`, `expenses: Expense[]`)
    - Header: formatted date range
    - Summary: total income, total expenses, difference — all computed client-side
    - Income list sorted ascending by `dayOfMonth`, each entry shows name + amount
    - Expense list sorted ascending by `dayOfMonth`, each entry shows name + amount
    - _Requirements: 8.1, 8.2, 8.3, 9.1, 9.2, 9.3, 9.4_

  - [x] 11.4 Write property test for period summary calculation (Property 12)
    - **Property 12: Period summary calculation correctness**
    - **Validates: Requirements 8.1**

  - [x] 11.5 Write property test for income list sort order (Property 13)
    - **Property 13: Income list sort order within period**
    - **Validates: Requirements 9.1**

  - [x] 11.6 Write property test for expense list sort order (Property 14)
    - **Property 14: Expense list sort order within period**
    - **Validates: Requirements 9.2**

  - [x] 11.7 Write property test for period income entry rendering (Property 15)
    - **Property 15: Period income entry rendering completeness**
    - **Validates: Requirements 9.3**

  - [x] 11.8 Write property test for period expense entry rendering (Property 16)
    - **Property 16: Period expense entry rendering completeness**
    - **Validates: Requirements 9.4**

- [x] 12. Implement AdminPage
  - [x] 12.1 Create `src/pages/AdminPage.tsx`
    - Three sections: Expense Categories, Payment Sources, Users
    - Each section fetches its data and renders an inline-edit table
    - Display mode: read-only row; Edit mode: input + Save/Cancel buttons
    - On save: fires update mutation with optimistic update; on success updates cache; on error shows notification and rolls back to previous value
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 11.1, 11.2, 11.3, 11.4, 12.1, 12.2, 12.3, 12.4_

  - [x] 12.2 Write property test for admin update failure rollback (Property 17)
    - **Property 17: Admin update failure rolls back UI state**
    - **Validates: Requirements 10.5, 11.4, 12.4**

- [x] 13. Wire up router and app entry point
  - [x] 13.1 Create `src/App.tsx`
    - Define `<BrowserRouter>` with all routes per the routing table
    - Wrap protected routes in `<ProtectedRoute>` and `<AppShell>`
    - Add catch-all `<Route path="*" element={<Navigate to="/" />} />`
    - _Requirements: 2.1, 3.1, 7.1, 10.1, 13.1_

  - [x] 13.2 Create `src/main.tsx`
    - Wrap app in `<QueryClientProvider>` with configured `QueryClient` (`staleTime: 5 * 60 * 1000`, `retry: 1`)
    - Render `<App />`
    - _Requirements: 14.1, 14.3_

  - [x] 13.3 Write property test for session data caching (Property 19)
    - **Property 19: Session data caching prevents redundant fetches**
    - **Validates: Requirements 14.3**

  - [x] 13.4 Write property test for every failed API request produces a notification (Property 20)
    - **Property 20: Every failed API request produces a notification**
    - **Validates: Requirements 15.1, 15.2**

- [x] 14. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Implement Heroku deployment configuration
  - [x] 15.1 Create `scripts/check-env.js`
    - Validate `VITE_API_BASE_URL` is set; exit with descriptive error if missing
    - _Requirements: 16.7_

  - [x] 15.2 Create `server.js`
    - Express app with HTTPS redirect middleware (checks `x-forwarded-proto` in production)
    - Serve static files from `/build` via `express.static`
    - SPA catch-all: serve `build/index.html` for all non-asset routes
    - Listen on `process.env.PORT || 3000`
    - _Requirements: 16.3, 16.4, 16.5_

  - [x] 15.3 Configure `package.json` scripts
    - Add `"prebuild": "node scripts/check-env.js"`, `"build": "vite build"`, `"start": "node server.js"`, `"heroku-postbuild": "npm run build"`
    - _Requirements: 16.2, 16.7_

  - [x] 15.4 Write integration tests for server.js
    - Test HTTPS redirect middleware
    - Test SPA fallback catch-all serves `index.html`
    - Test `PORT` env var is respected
    - _Requirements: 16.3, 16.4, 16.5_

  - [x] 15.5 Write integration test for check-env.js
    - Test build fails with descriptive message when `VITE_API_BASE_URL` is unset
    - _Requirements: 16.7_

- [x] 16. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` arbitraries; each is tagged with its property number from the design document
- Unit/component tests use Vitest + React Testing Library
- The `staleTime` of 5 minutes in `QueryClient` satisfies Requirement 14.3 (no redundant refetches within a session)
- Optimistic updates in the Admin mutations use TanStack Query's `onMutate`/`onError` rollback pattern
