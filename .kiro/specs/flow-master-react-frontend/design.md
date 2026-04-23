# Design Document: Flow Master React Frontend

## Overview

Flow Master is a React single-page application (SPA) that provides a personal finance management interface. It communicates with a separate REST API backend over HTTPS, using JWT-based authentication. The application is deployed as a static asset bundle served by a lightweight Node/Express server on Heroku.

The frontend is a pure client-side application — there is no server-side rendering. All routing is handled client-side by React Router. Data fetching, caching, and server-state synchronisation are handled by TanStack Query (React Query v5). Lightweight global client state (auth token, notification queue) is managed with Zustand.

### Key Design Decisions

| Concern | Choice | Rationale |
|---|---|---|
| UI framework | React 18 + TypeScript | Type safety, ecosystem maturity |
| Routing | React Router v6 | Industry standard, `<Outlet>`-based protected routes |
| Server state | TanStack Query v5 | Automatic caching, background refetch, loading/error states |
| Client state | Zustand | Minimal boilerplate, no context wrapping needed |
| HTTP client | Axios | Interceptor support for auth headers and 401 handling |
| Styling | Tailwind CSS | Utility-first, no runtime overhead |
| Build tool | Vite | Fast HMR, native ESM, straightforward env var handling |
| Static server | Express + `serve-static` | SPA fallback, HTTPS redirect, PORT env var |
| Testing | Vitest + React Testing Library + fast-check | Unit, component, and property-based tests |

---

## Architecture

### High-Level Structure

```
Browser
  └── React SPA (Vite build output)
        ├── React Router v6  (client-side routing)
        ├── TanStack Query   (server state / API data)
        ├── Zustand          (auth token, notifications)
        └── Axios instance   (HTTP, auth headers, 401 interceptor)
              └── REST API (separate Heroku dyno)
```

### Deployment Architecture

```
Heroku Dyno (web)
  └── Node.js process  (server.js)
        ├── Express middleware: HTTPS redirect
        ├── Express middleware: serve-static  →  /build/**
        └── Express catch-all: serve index.html  (SPA fallback)
```

The React build output (`/build`) is committed to the repository (or produced by the Heroku build step via `heroku-postbuild`). The Express server is the only process that runs at runtime — it never proxies to the API; the browser calls the API directly.

### Directory Structure

```
flow-master-react/
├── public/
├── src/
│   ├── api/              # Axios instance + per-resource query hooks
│   │   ├── client.ts     # Configured Axios instance
│   │   ├── auth.ts       # login() function
│   │   ├── periods.ts    # useActivePeriods, useCurrentPeriod, useGeneratePeriods
│   │   ├── incomes.ts    # useUpcomingIncomes
│   │   ├── expenses.ts   # useUpcomingExpenses
│   │   └── admin.ts      # useExpenseCategories, usePaymentSources, useUsers
│   ├── store/
│   │   ├── authStore.ts  # Zustand: token, setToken, clearToken
│   │   └── notificationStore.ts  # Zustand: notifications queue
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx      # Nav + <Outlet>
│   │   │   └── NavBar.tsx
│   │   ├── common/
│   │   │   ├── NotificationBanner.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   └── modals/
│   │       └── CreatePeriodsModal.tsx
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── PeriodsPage.tsx
│   │   └── AdminPage.tsx
│   ├── utils/
│   │   └── dateUtils.ts  # formatDate, isWithinNextDays
│   ├── types/
│   │   └── index.ts      # Shared TypeScript interfaces
│   ├── App.tsx           # Router definition
│   └── main.tsx          # Entry point, QueryClient, Zustand provider
├── server.js             # Express static server for Heroku
├── scripts/
│   └── check-env.js      # Build-time env var validation
├── package.json
└── vite.config.ts
```

---

## Components and Interfaces

### Router Definition (`App.tsx`)

```
<BrowserRouter>
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<ProtectedRoute />}>          ← checks auth, redirects if not
      <Route element={<AppShell />}>              ← persistent nav + outlet
        <Route path="/"        element={<DashboardPage />} />
        <Route path="/periods" element={<PeriodsPage />} />
        <Route path="/admin"   element={<AdminPage />} />
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/" />} />
  </Routes>
</BrowserRouter>
```

### `ProtectedRoute`

Reads the token from Zustand auth store. If no token is present, renders `<Navigate to="/login" replace />`. Otherwise renders `<Outlet />`.

```typescript
const ProtectedRoute: React.FC = () => {
  const token = useAuthStore(s => s.token);
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};
```

### `AppShell`

Renders `<NavBar />` and `<Outlet />`. Also renders `<NotificationBanner />` at a fixed position so notifications appear consistently across all screens.

### `NavBar`

- Links: Dashboard (`/`), Periods (`/periods`), Admin (`/admin`)
- Uses `useMatch` / `NavLink` `isActive` to highlight the active route
- Logout button calls `authStore.clearToken()` then `navigate('/login')`

### `NotificationBanner`

- Reads from `notificationStore`
- Renders each notification with a dismiss (`×`) button
- Fixed position (e.g., top-right corner) on all authenticated screens

### `LoginPage`

- Controlled form: `username`, `password`
- On submit: calls `login(username, password)` from `api/auth.ts`
- On success: stores token via `authStore.setToken(token)`, navigates to `/`
- On error: adds notification via `notificationStore.add(message)`, preserves username
- Disables submit button while request is in-flight (tracked with local `useState`)

### `DashboardPage`

- Calls `useCurrentPeriod()`, `useUpcomingIncomes()`, `useUpcomingExpenses()` — all run concurrently (TanStack Query fires them in parallel by default)
- Shows `<LoadingSpinner />` per section while `isLoading`
- Shows notification on query error (via `onError` / `useEffect` on `isError`)
- "Create Periods" button opens `<CreatePeriodsModal />`

### `CreatePeriodsModal`

- Local state: `count` (number, 1–12), `isOpen`
- Validates `count` is integer in [1, 12] before enabling submit
- On submit: calls `useGeneratePeriods` mutation
- Disables submit while mutation is pending
- On success: closes modal, invalidates Dashboard queries
- On error: shows notification inside modal, keeps modal open

### `PeriodsPage`

- Calls `useActivePeriods()` which returns periods with nested incomes and expenses
- Renders a horizontally scrollable container (`overflow-x: auto`)
- Each period is a fixed-width column (`PeriodColumn` component)
- Columns ordered by `startDate` ascending (sort client-side)

### `PeriodColumn`

- Props: `period: Period` (with `incomes: Income[]`, `expenses: Expense[]`)
- Header: date range
- Summary section: total income, total expenses, difference (computed client-side)
- Income list: sorted ascending by `dayOfMonth`
- Expense list: sorted ascending by `dayOfMonth`

### `AdminPage`

- Three sections: Expense Categories, Payment Sources, Users
- Each section uses an inline-edit table pattern:
  - Display mode: read-only row
  - Edit mode: input fields + Save/Cancel buttons
  - On save: fires mutation; on success updates cache; on error shows notification and reverts to previous value (optimistic update with rollback via TanStack Query's `onMutate`/`onError` pattern)

---

## Data Models

```typescript
// types/index.ts

export interface AuthResponse {
  token: string;
}

export interface Period {
  id: number;
  startDate: string;   // ISO 8601 date string
  endDate: string;
  incomes?: Income[];
  expenses?: Expense[];
}

export interface Income {
  id: number;
  name: string;
  amount: number;
  scheduledDate: string;  // ISO 8601
  dayOfMonth: number;
  periodId: number;
}

export interface Expense {
  id: number;
  name: string;
  amount: number;
  dueDate: string;        // ISO 8601
  dayOfMonth: number;
  periodId: number;
  categoryId?: number;
  paymentSourceId?: number;
}

export interface ExpenseCategory {
  id: number;
  name: string;
}

export interface PaymentSource {
  id: number;
  name: string;
}

export interface User {
  id: number;
  username: string;
  email?: string;
}

export interface Notification {
  id: string;           // uuid
  message: string;
}
```

---

## API Integration Layer

### Axios Instance (`api/client.ts`)

```typescript
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Request interceptor: attach Bearer token
apiClient.interceptors.request.use(config => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearToken();
      window.location.replace('/login');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

> Note: `useAuthStore.getState()` is used outside React components — this is the Zustand pattern for accessing store state in non-component contexts (interceptors, utilities).

### Query Keys

All query keys are centralised to avoid typos and enable targeted invalidation:

```typescript
export const queryKeys = {
  currentPeriod:    ['currentPeriod'] as const,
  activePeriods:    ['activePeriods'] as const,
  upcomingIncomes:  ['upcomingIncomes'] as const,
  upcomingExpenses: ['upcomingExpenses'] as const,
  expenseCategories: ['expenseCategories'] as const,
  paymentSources:   ['paymentSources'] as const,
  users:            ['users'] as const,
};
```

### TanStack Query Configuration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 minutes — avoids redundant refetches on navigation
      retry: 1,
    },
  },
});
```

The `staleTime` of 5 minutes satisfies Requirement 14.3: navigating between screens within a session will serve cached data rather than re-fetching.

### Error Notification Integration

Each page uses a `useEffect` watching `isError` from TanStack Query hooks to push notifications into the Zustand notification store:

```typescript
useEffect(() => {
  if (isError) {
    notificationStore.add(error?.message ?? 'Failed to load data');
  }
}, [isError]);
```

---

## State Management

### Auth Store (Zustand)

```typescript
interface AuthState {
  token: string | null;
  setToken: (token: string) => void;
  clearToken: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      token: null,
      setToken: token => set({ token }),
      clearToken: () => set({ token: null }),
    }),
    { name: 'auth-token', storage: createJSONStorage(() => localStorage) }
  )
);
```

The `persist` middleware stores the token in `localStorage`, satisfying the requirement that the JWT persists across page refreshes.

### Notification Store (Zustand)

```typescript
interface NotificationState {
  notifications: Notification[];
  add: (message: string) => void;
  dismiss: (id: string) => void;
}
```

Notifications are ephemeral — they are not persisted. The `NotificationBanner` component subscribes to this store and renders all active notifications.

### Server State (TanStack Query)

All API data (periods, incomes, expenses, admin entities) lives in the TanStack Query cache. Components access data via custom hooks (`useCurrentPeriod`, `useActivePeriods`, etc.) that wrap `useQuery` / `useMutation`. This eliminates prop-drilling for server data — any component can call the hook directly.

---

## Routing Structure

| Path | Component | Auth Required |
|---|---|---|
| `/login` | `LoginPage` | No |
| `/` | `DashboardPage` | Yes |
| `/periods` | `PeriodsPage` | Yes |
| `/admin` | `AdminPage` | Yes |
| `*` | Redirect to `/` | — |

Protected routes are wrapped in `<ProtectedRoute>` which checks the Zustand auth store. Unauthenticated access to any protected route redirects to `/login`.

---

## Error Handling

| Scenario | Handling |
|---|---|
| Login API error | Notification on LoginPage; username field preserved |
| 401 on any request | Axios interceptor clears token, redirects to `/login` |
| Dashboard fetch failure | Notification per failed query; other sections still render |
| Generate periods failure | Notification inside modal; modal stays open |
| Admin update failure | Notification; TanStack Query `onError` rolls back optimistic update |
| Missing `VITE_API_BASE_URL` at build | `scripts/check-env.js` fails the build with a descriptive message |

All user-visible errors flow through the Zustand notification store and are rendered by `NotificationBanner`. Every notification includes a dismiss button.

---

## Heroku Deployment

### `server.js`

```javascript
const express = require('express');
const path = require('path');
const app = express();

// HTTPS redirect
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https' && process.env.NODE_ENV === 'production') {
    return res.redirect(301, 'https://' + req.headers.host + req.url);
  }
  next();
});

// Serve static build output
app.use(express.static(path.join(__dirname, 'build')));

// SPA fallback — serve index.html for all non-asset routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
```

### `scripts/check-env.js`

```javascript
const required = ['VITE_API_BASE_URL'];
const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`Build failed: missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}
```

Called from `package.json`:

```json
{
  "scripts": {
    "prebuild": "node scripts/check-env.js",
    "build": "vite build",
    "start": "node server.js",
    "heroku-postbuild": "npm run build"
  }
}
```

### Required Heroku Config Vars

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the REST API (e.g., `https://api.flowmaster.example.com`) |
| `NODE_ENV` | Set to `production` to enable HTTPS redirect |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Bearer token present on all authenticated requests

*For any* API request made while a JWT token is stored in the auth store, the outgoing HTTP request SHALL include an `Authorization: Bearer <token>` header.

**Validates: Requirements 1.6**

---

### Property 2: Unauthenticated navigation always redirects to login

*For any* route path attempted by a user with no token in the auth store, the rendered output SHALL be a redirect to `/login`.

**Validates: Requirements 2.1**

---

### Property 3: 401 response always clears token

*For any* API response with HTTP status 401, the auth store token SHALL be `null` after the response is processed.

**Validates: Requirements 2.2**

---

### Property 4: Dashboard fetch failure always produces a notification

*For any* combination of failed fetches among `currentPeriod`, `upcomingIncomes`, and `upcomingExpenses`, at least one notification SHALL be present in the notification store describing the failure.

**Validates: Requirements 3.5**

---

### Property 5: Period date formatting

*For any* `Period` with valid ISO 8601 `startDate` and `endDate` strings, the formatted output SHALL match the pattern `MMM D, YYYY` (e.g., "Jan 5, 2025").

**Validates: Requirements 4.1**

---

### Property 6: Upcoming income filter correctness

*For any* list of `Income` objects with varying `scheduledDate` values, the filtered result SHALL contain exactly those incomes whose `scheduledDate` falls within the range [today, today + 3 days] inclusive, and SHALL exclude all others.

**Validates: Requirements 5.1**

---

### Property 7: Upcoming expense filter correctness

*For any* list of `Expense` objects with varying `dueDate` values, the filtered result SHALL contain exactly those expenses whose `dueDate` falls within the range [today, today + 3 days] inclusive, and SHALL exclude all others.

**Validates: Requirements 5.2**

---

### Property 8: Income entry rendering completeness

*For any* `Income` object, the rendered component output SHALL contain both the income's `name` and its `scheduledDate`.

**Validates: Requirements 5.5**

---

### Property 9: Expense entry rendering completeness (Dashboard)

*For any* `Expense` object rendered on the Dashboard, the rendered component output SHALL contain both the expense's `name` and its `dueDate`.

**Validates: Requirements 5.6**

---

### Property 10: Period modal input validation

*For any* integer value `n`, the `CreatePeriodsModal` input validation SHALL accept `n` if and only if `1 ≤ n ≤ 12`. For any value outside this range (including non-integers), the Submit button SHALL remain disabled.

**Validates: Requirements 6.8**

---

### Property 11: Period column ordering

*For any* list of `Period` objects with varying `startDate` values, the rendered `PeriodsPage` SHALL display the period columns in ascending `startDate` order (oldest leftmost, newest rightmost).

**Validates: Requirements 7.3**

---

### Property 12: Period summary calculation correctness

*For any* `Period` with associated `Income[]` and `Expense[]` arrays, the displayed summary values SHALL satisfy:
- `totalIncome = sum(income.amount for income in incomes)`
- `totalExpenses = sum(expense.amount for expense in expenses)`
- `difference = totalIncome - totalExpenses`

**Validates: Requirements 8.1**

---

### Property 13: Income list sort order within period

*For any* `Period` with associated `Income[]`, the rendered income list SHALL be sorted in ascending order by `dayOfMonth`.

**Validates: Requirements 9.1**

---

### Property 14: Expense list sort order within period

*For any* `Period` with associated `Expense[]`, the rendered expense list SHALL be sorted in ascending order by `dayOfMonth`.

**Validates: Requirements 9.2**

---

### Property 15: Period income entry rendering completeness

*For any* `Income` object rendered in a `PeriodColumn`, the rendered output SHALL contain both the income's `name` and its `amount`.

**Validates: Requirements 9.3**

---

### Property 16: Period expense entry rendering completeness

*For any* `Expense` object rendered in a `PeriodColumn`, the rendered output SHALL contain both the expense's `name` and its `amount`.

**Validates: Requirements 9.4**

---

### Property 17: Admin update failure rolls back UI state

*For any* admin entity (ExpenseCategory, PaymentSource, or User) whose update mutation fails, the displayed value in the UI SHALL revert to the value it held before the edit was initiated, and a notification SHALL be present in the notification store.

**Validates: Requirements 10.5, 11.4, 12.4**

---

### Property 18: Active route navigation link is highlighted

*For any* authenticated route the user navigates to, the `NavBar` SHALL render the corresponding navigation link with its active style applied, and all other links SHALL NOT have the active style applied.

**Validates: Requirements 13.2**

---

### Property 19: Session data caching prevents redundant fetches

*For any* query that has been successfully fetched within the current session (within `staleTime`), navigating away from and back to the same screen SHALL NOT trigger a new network request for that query.

**Validates: Requirements 14.3**

---

### Property 20: Every failed API request produces a notification

*For any* failed API request (network error or non-2xx response), at least one notification SHALL be added to the notification store with a non-empty human-readable message.

**Validates: Requirements 15.1, 15.2**

---

### Property 21: Every notification has a dismiss mechanism

*For any* notification rendered by `NotificationBanner`, the rendered output SHALL include a dismiss control (button or equivalent interactive element).

**Validates: Requirements 15.3**

---

### Property 22: Notification location is consistent across screens

*For any* authenticated route, the `NotificationBanner` SHALL be rendered at the same DOM position (fixed top-right) regardless of which screen is active.

**Validates: Requirements 15.4**

---

## Testing Strategy

### Dual Testing Approach

Unit/component tests verify specific examples, edge cases, and integration points. Property-based tests verify universal properties across many generated inputs. Both are necessary for comprehensive coverage.

### Property-Based Testing

**Library**: [fast-check](https://fast-check.dev/) — the leading property-based testing library for TypeScript/JavaScript.

**Runner**: Vitest (configured with `--run` for CI; watch mode for local development).

**Minimum iterations**: 100 per property test (fast-check default).

**Tag format**: Each property test is tagged with a comment:
```
// Feature: flow-master-react-frontend, Property N: <property text>
```

Each correctness property above maps to exactly one property-based test. The tests use fast-check arbitraries to generate:
- Random `Income[]` / `Expense[]` arrays with varied dates and amounts
- Random route paths (for routing properties)
- Random integer values (for modal validation)
- Random `Period[]` arrays with varied start dates

### Unit / Component Tests

Vitest + React Testing Library for:
- Login form submission, error display, button disable state
- Dashboard loading indicators and empty states
- Modal open/close/dismiss behavior
- Admin inline-edit save/cancel flow
- NavBar logout action
- `ProtectedRoute` redirect behavior (example-based)

### Integration / Smoke Tests

- Axios interceptor wiring (request header, 401 handling)
- `server.js` HTTPS redirect middleware
- `server.js` SPA fallback catch-all
- Build-time env var check (`scripts/check-env.js`)
- `VITE_API_BASE_URL` usage in `api/client.ts` (no hardcoded URLs)
