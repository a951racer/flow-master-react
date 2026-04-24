# Requirements: Flow Master React Frontend

## 1. Authentication

- 1.1 The app SHALL provide a login page accessible at `/login`
- 1.2 The login form SHALL accept email and password
- 1.3 On successful login, the app SHALL store the JWT token in localStorage and navigate to the dashboard
- 1.4 On failed login, the app SHALL display a notification and preserve the email field
- 1.5 The login button SHALL be disabled while a login request is in-flight
- 1.6 All authenticated API requests SHALL include a `Bearer` token in the `Authorization` header
- 1.7 Any API response with HTTP 401 SHALL clear the stored token and redirect to `/login`
- 1.8 The JWT token SHALL persist across page refreshes

## 2. Navigation and Routing

- 2.1 Unauthenticated users attempting to access any protected route SHALL be redirected to `/login`
- 2.2 The navigation bar SHALL appear on all authenticated pages
- 2.3 The nav bar SHALL contain links in order: Dashboard, Flow, Expenses, Income, Admin
- 2.4 The currently active nav link SHALL be visually highlighted
- 2.5 The nav bar SHALL display the Flow Master logo on the left
- 2.6 The nav bar SHALL include a Logout button that clears the token and redirects to `/login`
- 2.7 The nav bar background SHALL use color `#0F2E5D`
- 2.8 The Logout button SHALL use color `#5FA343`

## 3. Login Page Appearance

- 3.1 The login page background SHALL display the `login-bg.png` image covering the full browser window
- 3.2 The login form SHALL appear in a floating white panel positioned toward the right side of the screen
- 3.3 The login panel SHALL display `login-logo.png` at full panel width at the top
- 3.4 The login panel SHALL display a tagline below the logo
- 3.5 The browser tab icon SHALL use `favicon.png`
- 3.6 The browser tab title SHALL be "Flow Master"

## 4. Dashboard

- 4.1 The dashboard SHALL display the current active period's date range
- 4.2 The dashboard SHALL display incomes scheduled within the next 3 days
- 4.3 The dashboard SHALL display expenses due within the next 3 days
- 4.4 Each section SHALL show a loading indicator while data is being fetched
- 4.5 Failed fetches SHALL display a notification; other sections SHALL continue to render
- 4.6 The dashboard SHALL NOT include a "Create Periods" button (moved to Flow page)
- 4.7 Each upcoming income row SHALL display: name, calculated next occurrence date, and amount (green)
- 4.8 Each upcoming expense row SHALL display: name, payment source, calculated next occurrence date, and amount (red)
- 4.9 The next occurrence date SHALL be calculated from the item's `dayOfMonth` — if that day is today or later this month, show this month's date; otherwise show next month's date

## 5. Create Periods Modal

- 5.1 The modal SHALL be accessible from the Flow page via a "Create Periods" button (`#2F6FB5`)
- 5.2 The submit button SHALL be disabled for values outside [1, 12] or non-integers
- 5.3 On success, the modal SHALL close and dashboard data SHALL refresh
- 5.4 On failure, a notification SHALL appear inside the modal and it SHALL remain open

## 6. Flow Page (Periods)

- 6.1 The page title SHALL be "Flow"
- 6.2 The page SHALL include a "Create Periods" button (`#2F6FB5`) that opens the Create Periods modal
- 6.3 The page SHALL display active periods as horizontally scrollable columns
- 6.4 Columns SHALL be ordered by `startDate` ascending (oldest left, newest right)
- 6.5 Each column header SHALL display only the period start date
- 6.6 Each column SHALL show total income, total expenses, and difference
- 6.5 Each column SHALL list incomes sorted ascending by day of month
- 6.6 Each column SHALL list expenses sorted ascending by day of month
- 6.7 Each income/expense row SHALL display: name | day of month | amount

## 7. Expenses Page

- 7.1 The page SHALL display all expenses in a table sorted alphabetically by payee
- 7.2 By default, only active (non-inactive) expenses SHALL be shown
- 7.3 A "Show inactive" checkbox SHALL toggle display of inactive expenses
- 7.4 Inactive expense rows SHALL be visually dimmed
- 7.5 Table columns SHALL be: Payee, Type, Category, Payment Source, Amount, Day, Required, Inactive, Actions
- 7.6 A "+ Add Expense" button SHALL insert an inline form row for creating a new expense
- 7.7 Each row SHALL have an Edit button (`#2F6FB5`) that replaces the row with an inline edit form
- 7.8 Each row SHALL have a Delete button (red) with a confirmation dialog
- 7.9 The inline form SHALL require Payee, Category, and Payment Source before enabling Save
- 7.10 Expense type SHALL be selectable from: expense, debt, bill

## 8. Income Page

- 8.1 The page SHALL display all incomes in a table sorted alphabetically by source
- 8.2 By default, only active (non-inactive) incomes SHALL be shown
- 8.3 A "Show inactive" checkbox SHALL toggle display of inactive incomes
- 8.4 Inactive income rows SHALL be visually dimmed
- 8.5 Table columns SHALL be: Source, Amount, Day, Paycheck, Inactive, Actions
- 8.6 A "+ Add Income" button SHALL insert an inline form row for creating a new income
- 8.7 Each row SHALL have an Edit button (`#2F6FB5`) and a Delete button (red) with confirmation
- 8.8 The inline form SHALL require Source before enabling Save

## 9. Admin Page

- 9.1 The page title SHALL be "Admin"
- 9.2 The page SHALL have three sections: Expense Categories, Payment Sources, Users
- 9.3 Expense Categories and Payment Sources SHALL support create, inline-edit, and delete
- 9.4 Delete SHALL require confirmation via a dialog
- 9.5 All tables SHALL be sorted alphabetically by name
- 9.6 Name columns SHALL be left-aligned; action buttons SHALL be right-aligned
- 9.7 The Users table SHALL be read-only, displaying First Name, Last Name, Email
- 9.8 Users SHALL be sorted by last name then first name

## 10. Layout and Appearance

- 10.1 The app content width SHALL be 75% of the browser window, centered
- 10.2 Edit buttons throughout the app SHALL use color `#2F6FB5`
- 10.3 Add/Create buttons throughout the app SHALL use color `#5FA343`
- 10.4 All pages SHALL use a light gray background (`bg-gray-50`)

## 11. Error Handling and Notifications

- 11.1 All API errors SHALL produce a user-visible notification with a descriptive message
- 11.2 Every notification SHALL include a dismiss button
- 11.3 Notifications SHALL appear at a consistent fixed position across all screens
- 11.4 Failed admin mutations SHALL roll back optimistic UI updates

## 12. Performance

- 12.1 Successfully fetched query data SHALL be cached for 5 minutes (staleTime)
- 12.2 Navigating between pages within a session SHALL NOT trigger redundant API requests for cached data

## 13. Deployment

- 13.1 The build SHALL fail if `VITE_API_BASE_URL` is not set
- 13.2 The Express server SHALL redirect HTTP to HTTPS in production
- 13.3 The Express server SHALL serve `index.html` for all non-asset routes (SPA fallback)
- 13.4 `express` SHALL be listed in `dependencies` (not `devDependencies`) for Heroku compatibility
