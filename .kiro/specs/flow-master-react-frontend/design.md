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
        ├── Express middleware: serve-static  →  /dist/**
        └── Express catch-all: serve index.html  (SPA fallback)
```

### Directory Structure

```
flow-master-react/
├── public/
│   ├── logo.png          # Navbar logo (86x86px)
│   ├── login-logo.png    # Login panel logo (full panel width)
│   ├── login-bg.png      # Login page background image
│   ├── app-bg.png        # Authenticated pages background wallpaper
│   └── favicon.png       # Browser tab icon
├── src/
│   ├── api/
│   │   ├── client.ts     # Configured Axios instance
│   │   ├── auth.ts       # login() function
│   │   ├── periods.ts    # useActivePeriods, useCurrentPeriod, useGeneratePeriods
│   │   ├── incomes.ts    # useAllIncomes, useUpcomingIncomes, useCreateIncome, useUpdateIncome, useDeleteIncome
│   │   ├── expenses.ts   # useAllExpenses, useUpcomingExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense
│   │   └── admin.ts      # useExpenseCategories, usePaymentSources, useUsers + mutations
│   ├── store/
│   │   ├── authStore.ts
│   │   └── notificationStore.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
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
│   │   ├── ExpensesPage.tsx
│   │   ├── IncomePage.tsx
│   │   └── AdminPage.tsx
│   ├── utils/
│   │   └── dateUtils.ts  # formatDate, isWithinNextDays, isDayOfMonthWithinNextDays, nextOccurrenceFromDayOfMonth, formatCurrency
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── server.js
├── scripts/
│   └── check-env.js
├── package.json
└── vite.config.ts
```

---

## Components and Interfaces

### Router Definition (`App.tsx`)

```
<BrowserRouter>
  <Routes>
    <Route path="/login"    element={<LoginPage />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<AppShell />}>
        <Route path="/"         element={<DashboardPage />} />
        <Route path="/periods"  element={<PeriodsPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/income"   element={<IncomePage />} />
        <Route path="/admin"    element={<AdminPage />} />
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/" />} />
  </Routes>
</BrowserRouter>
```

### `AppShell`

Renders `<NavBar />`, `<NotificationBanner />`, and `<Outlet />`. The main content area uses `w-full` with no container constraint — width is controlled by `#root` in `index.css` (75% of browser window, centered). Background: `app-bg.png` tiled (`backgroundRepeat: repeat`, `backgroundSize: auto`, `backgroundAttachment: fixed`).

### `NavBar`

- Background color: `#0F2E5D` (dark navy)
- Logo: `logo.png` at 86x86px with `object-contain`, left side
- Links (left to right): Dashboard (`/`), Flow (`/periods`), Expenses (`/expenses`), Income (`/income`), Admin (`/admin`)
- Active link highlighted in blue; inactive links in gray
- Logout button: `#5FA343` (green), calls `authStore.clearToken()` then navigates to `/login`
- Compact vertical padding (`py-1`) to minimize height

### `LoginPage`

- Full browser window (`fixed inset-0`) with `login-bg.png` as background
- Floating white panel on the right side (`w-96`, rounded, shadow, `pr-16` from edge)
- Panel contains: `login-logo.png` (full panel width), tagline, email + password fields with icons, "Log In" button
- On success: stores token, navigates to `/`
- On error: adds notification, preserves email field

### `DashboardPage`

- Three sections: Current Period, Upcoming Incomes (next 3 days), Upcoming Expenses (next 3 days)
- Upcoming items filtered client-side using `isDayOfMonthWithinNextDays(dayOfMonth, 3)` — incomes and expenses are recurring monthly records with no stored date, only `dayOfMonth`
- Each upcoming income row: name | calculated next occurrence date (green amount)
- Each upcoming expense row: name | payment source name | calculated next occurrence date | amount (red)
- Next occurrence date computed via `nextOccurrenceFromDayOfMonth(dayOfMonth)` in `dateUtils.ts`
- Payment sources fetched via `usePaymentSources()` and looked up by `paymentSourceId`

### `PeriodsPage` (titled "Flow")

- "Create Periods" button (`#2F6FB5`) in the page header opens `<CreatePeriodsModal />`
- Horizontally scrollable period columns (`w-96` each)
- Each `PeriodColumn` maintains local state for incomes and expenses, synced from props
- Each column: start date header, income/expense summary (using `overrideAmount` if set; deferred expenses contribute $0 to total), sorted income list, sorted expense list
- Income row: name | day | amount | `isReceived` checkbox — checkbox change immediately calls `useUpdatePeriod`
- Expense row: name | day | amount (gray=Unpaid/Paid no override, blue=has override with original tooltip, red=Deferred shows $0.00 with original tooltip) | pencil icon. Paid and Deferred rows show strikethrough + reduced opacity on all data except pencil. Status text not displayed (conveyed visually).
- `ExpenseEditModal`: shows expense name/amount, status radio (Unpaid/Paid/Deferred), override amount input, Save and Cancel buttons. Save triggers `useUpdatePeriod`.
- `PeriodExpenseEntry` has `isCarryOver?: boolean` flag to distinguish carry-overs from regular expenses
- Deferred carry-overs: added to next period with `isCarryOver: true`, `status: 'Unpaid'`, original amount, displayed in red with `↩` prefix, no pencil icon
- Carry-over management handled in `PeriodsPage` via `handleExpenseSave` which updates both current and next period atomically

### `ExpensesPage`

- Full-width table with columns: Payee, Type, Category, Payment Source, Amount, Day, Required, Inactive, Actions
- "Show inactive" checkbox toggle (default: active only)
- Inactive rows visually dimmed (`opacity-50`)
- "+ Add Expense" button (green `#5FA343`) inserts inline form row at top of table
- Edit button (`#2F6FB5`) replaces row with inline form
- Delete button (red) with confirmation dialog
- Sorted alphabetically by payee

### `IncomePage`

- Full-width table with columns: Source, Amount, Day, Paycheck, Inactive, Actions
- "Show inactive" checkbox toggle (default: active only)
- Inactive rows visually dimmed
- "+ Add Income" button (green) inserts inline form row
- Edit (`#2F6FB5`) and Delete (red) per row with same patterns as ExpensesPage
- Sorted alphabetically by source

### `AdminPage` (titled "Admin")

- Three sections: Expense Categories, Payment Sources, Users
- Expense Categories and Payment Sources: inline-edit table with create (Add button) and delete (confirmation dialog)
- Users: create form (First Name, Last Name, Email, Password — password masked, never displayed after save) via `POST /auth/register`; inline-edit (First Name, Last Name, Email) via `PUT /users/:id`; delete with confirmation via `DELETE /users/:id`. Sorted by last name then first name.
- All tables sorted alphabetically; name columns left-aligned, action buttons right-aligned

---

## Data Models

```typescript
export interface AuthResponse {
  token: string;
}

export interface Period {
  id: string;
  startDate: string;
  endDate: string;
  incomes?: PeriodIncomeEntry[];
  expenses?: PeriodExpenseEntry[];
}

export interface PeriodIncomeEntry {
  incomeId: string;
  name: string;
  amount: number;
  dayOfMonth: number;
  isReceived: boolean;
  overrideAmount?: number;
}

export interface PeriodExpenseEntry {
  expenseId: string;
  name: string;
  amount: number;
  dayOfMonth: number;
  status: 'Unpaid' | 'Paid' | 'Deferred';
  overrideAmount?: number;
  paymentSourceId?: string;
}

export interface Income {
  id: string;
  name: string;        // mapped from source
  source: string;
  amount: number;
  scheduledDate: string;
  dayOfMonth: number;
  periodId?: string;
  isPaycheck: boolean;
  inactive: boolean;
  inactiveDate?: string;
}

export interface Expense {
  id: string;
  name: string;        // mapped from payee
  payee: string;
  amount: number;
  dueDate: string;
  dayOfMonth: number;
  periodId?: string;
  categoryId: string;
  paymentSourceId: string;
  type: 'expense' | 'debt' | 'bill';
  payeeUrl?: string;
  required: boolean;
  inactive: boolean;
  inactiveDate?: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;        // mapped from category
}

export interface PaymentSource {
  id: string;
  name: string;        // mapped from source
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Notification {
  id: string;
  message: string;
}
```

### MongoDB Field Mappings

| Model | Backend field | Frontend field |
|---|---|---|
| All | `_id` | `id` |
| Income | `source` | `name` / `source` |
| Expense | `payee` | `name` / `payee` |
| ExpenseCategory | `category` | `name` |
| PaymentSource | `source` | `name` |

---

## API Integration Layer

### Axios Instance (`api/client.ts`)

- `baseURL`: `import.meta.env.VITE_API_BASE_URL`
- Request interceptor: attaches `Authorization: Bearer <token>`
- Response interceptor: on 401, clears token and redirects to `/login`

### Query Keys

```typescript
export const queryKeys = {
  currentPeriod:     ['currentPeriod'],
  activePeriods:     ['activePeriods'],
  upcomingIncomes:   ['upcomingIncomes'],
  upcomingExpenses:  ['upcomingExpenses'],
  expenseCategories: ['expenseCategories'],
  paymentSources:    ['paymentSources'],
  users:             ['users'],
};

// Additional keys defined locally in each API module:
const incomeQueryKey  = ['allIncomes'];
const expenseQueryKey = ['allExpenses'];
```

### API Hooks Summary

| Hook | Method | Endpoint |
|---|---|---|
| `useCurrentPeriod` | GET | `periods` (client-side filter) |
| `useActivePeriods` | GET | `periods` (client-side filter) |
| `useGeneratePeriods` | POST | `periods/generate/:count` |
| `useUpdatePeriod` | PUT | `periods/:id` |
| `useAllIncomes` | GET | `incomes` |
| `useUpcomingIncomes` | GET | `incomes` (client-side filter) |
| `useCreateIncome` | POST | `incomes` |
| `useUpdateIncome` | PUT | `incomes/:id` |
| `useDeleteIncome` | DELETE | `incomes/:id` |
| `useAllExpenses` | GET | `expenses` |
| `useUpcomingExpenses` | GET | `expenses` (client-side filter) |
| `useCreateExpense` | POST | `expenses` |
| `useUpdateExpense` | PUT | `expenses/:id` |
| `useDeleteExpense` | DELETE | `expenses/:id` |
| `useExpenseCategories` | GET | `expense-categories` |
| `useCreateExpenseCategory` | POST | `expense-categories` |
| `useUpdateExpenseCategory` | PUT | `expense-categories/:id` |
| `useDeleteExpenseCategory` | DELETE | `expense-categories/:id` |
| `usePaymentSources` | GET | `payment-sources` |
| `useCreatePaymentSource` | POST | `payment-sources` |
| `useUpdatePaymentSource` | PUT | `payment-sources/:id` |
| `useDeletePaymentSource` | DELETE | `payment-sources/:id` |
| `useUsers` | GET | `users` |
| `useCreateUser` | POST | `auth/register` |
| `useUpdateUser` | PUT | `users/:id` |
| `useDeleteUser` | DELETE | `users/:id` |

---

## Routing Structure

| Path | Component | Title | Auth Required |
|---|---|---|---|
| `/login` | `LoginPage` | — | No |
| `/` | `DashboardPage` | Dashboard | Yes |
| `/periods` | `PeriodsPage` | Flow | Yes |
| `/expenses` | `ExpensesPage` | Expenses | Yes |
| `/income` | `IncomePage` | Income | Yes |
| `/admin` | `AdminPage` | Admin | Yes |
| `*` | Redirect to `/` | — | — |

---

## Visual Design

### Color Palette

| Element | Color |
|---|---|
| NavBar background | `#0F2E5D` |
| Logout button | `#5FA343` |
| Edit buttons | `#2F6FB5` |
| Add/Create buttons | `#5FA343` |
| Login button | `#3B82F6` (blue-500) |

### Layout

- `#root` width: 75% of browser window, centered (`margin: 0 auto`)
- Login page: full browser window (`fixed inset-0`), background image, floating right-side panel
- All other pages: full width within `#root`, no additional max-width container

---

## Error Handling

| Scenario | Handling |
|---|---|
| Login API error | Notification; email field preserved |
| 401 on any request | Axios interceptor clears token, redirects to `/login` |
| Dashboard fetch failure | Notification per failed query |
| Generate periods failure | Notification inside modal; modal stays open |
| Admin update failure | Notification; optimistic update rolled back |
| Expense/Income CRUD failure | Notification displayed |
| Missing `VITE_API_BASE_URL` at build | `scripts/check-env.js` fails build |

---

## Correctness Properties

### Property 1: Bearer token present on all authenticated requests
*For any* API request made while a JWT token is stored, the outgoing HTTP request SHALL include `Authorization: Bearer <token>`.

### Property 2: Unauthenticated navigation always redirects to login
*For any* protected route attempted without a token, the rendered output SHALL redirect to `/login`.

### Property 3: 401 response always clears token
*For any* API response with HTTP status 401, the auth store token SHALL be `null` after processing.

### Property 4: Dashboard fetch failure always produces a notification
*For any* failed fetch among `currentPeriod`, `upcomingIncomes`, `upcomingExpenses`, at least one notification SHALL be present.

### Property 5: Period date formatting
*For any* `Period` with valid ISO 8601 dates, formatted output SHALL match `MMM D, YYYY`.

### Property 6: Upcoming income filter correctness
*For any* `Income[]`, filtered result SHALL contain exactly those with `scheduledDate` in [today, today+3].

### Property 7: Upcoming expense filter correctness
*For any* `Expense[]`, filtered result SHALL contain exactly those with `dueDate` in [today, today+3].

### Property 8: Active-only filter correctness (Expenses/Income pages)
*For any* list of expenses or incomes, when "Show inactive" is unchecked, the rendered list SHALL contain only items where `inactive === false`.

### Property 9: Period column ordering
*For any* `Period[]`, rendered columns SHALL be in ascending `startDate` order.

### Property 10: Period summary calculation correctness
*For any* `Period`, displayed summary SHALL satisfy `totalIncome = Σ(income.amount)`, `totalExpenses = Σ(expense.amount)`, `difference = totalIncome - totalExpenses`.

### Property 11: Income list sort order within period
*For any* `Period`, rendered income list SHALL be sorted ascending by `dayOfMonth`.

### Property 12: Expense list sort order within period
*For any* `Period`, rendered expense list SHALL be sorted ascending by `dayOfMonth`.

### Property 13: Period income entry rendering completeness
*For any* `Income` in a `PeriodColumn`, rendered output SHALL contain `name`, `dayOfMonth`, and `amount`.

### Property 14: Period expense entry rendering completeness
*For any* `Expense` in a `PeriodColumn`, rendered output SHALL contain `name`, `dayOfMonth`, and `amount`.

### Property 15: Admin update failure rolls back UI state
*For any* failed admin mutation, displayed value SHALL revert to pre-edit value and a notification SHALL be present.

### Property 16: Active route navigation link is highlighted
*For any* authenticated route, the corresponding NavBar link SHALL have active style; all others SHALL NOT.

### Property 17: Session data caching prevents redundant fetches
*For any* query fetched within `staleTime`, navigating away and back SHALL NOT trigger a new network request.

### Property 18: Every failed API request produces a notification
*For any* failed API request, at least one notification SHALL be added with a non-empty message.

### Property 19: Every notification has a dismiss mechanism
*For any* rendered notification, the output SHALL include a dismiss control.

---

## Testing Strategy

- **Property-based tests**: fast-check, minimum 100 iterations per property
- **Component tests**: Vitest + React Testing Library
- **Integration/smoke tests**: Axios interceptors, server.js middleware, env var check
