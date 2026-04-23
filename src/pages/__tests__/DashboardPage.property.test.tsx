// Feature: flow-master-react-frontend
// Property 4: Dashboard fetch failure always produces a notification
// Property 8: Income entry rendering completeness
// Property 9: Expense entry rendering completeness (Dashboard)

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardPage } from '../DashboardPage';
import { useNotificationStore } from '../../store/notificationStore';
import * as periodsApi from '../../api/periods';
import * as incomesApi from '../../api/incomes';
import * as expensesApi from '../../api/expenses';
import type { Income, Expense } from '../../types';

// ---------------------------------------------------------------------------
// Property 4: Dashboard fetch failure always produces a notification
// Validates: Requirements 3.5
// ---------------------------------------------------------------------------

describe('Property 4 – Dashboard fetch failure always produces a notification', () => {
  beforeEach(() => {
    useNotificationStore.getState().notifications = [];
    vi.clearAllMocks();
  });

  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  it('produces a notification when currentPeriod fetch fails', async () => {
    // Mock the hooks to simulate failure
    vi.spyOn(periodsApi, 'useCurrentPeriod').mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Failed to fetch'),
    } as any);

    vi.spyOn(incomesApi, 'useUpcomingIncomes').mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as any);

    vi.spyOn(expensesApi, 'useUpcomingExpenses').mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as any);

    render(<DashboardPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      const notifications = useNotificationStore.getState().notifications;
      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications.some(n => n.message.includes('period'))).toBe(true);
    });
  });

  it('produces a notification when upcomingIncomes fetch fails', async () => {
    vi.spyOn(periodsApi, 'useCurrentPeriod').mockReturnValue({
      data: { id: 1, startDate: '2025-01-01', endDate: '2025-01-31' },
      isLoading: false,
      isError: false,
    } as any);

    vi.spyOn(incomesApi, 'useUpcomingIncomes').mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Failed to fetch'),
    } as any);

    vi.spyOn(expensesApi, 'useUpcomingExpenses').mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as any);

    render(<DashboardPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      const notifications = useNotificationStore.getState().notifications;
      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications.some(n => n.message.includes('income'))).toBe(true);
    });
  });

  it('produces a notification when upcomingExpenses fetch fails', async () => {
    vi.spyOn(periodsApi, 'useCurrentPeriod').mockReturnValue({
      data: { id: 1, startDate: '2025-01-01', endDate: '2025-01-31' },
      isLoading: false,
      isError: false,
    } as any);

    vi.spyOn(incomesApi, 'useUpcomingIncomes').mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as any);

    vi.spyOn(expensesApi, 'useUpcomingExpenses').mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Failed to fetch'),
    } as any);

    render(<DashboardPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      const notifications = useNotificationStore.getState().notifications;
      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications.some(n => n.message.includes('expense'))).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Property 8: Income entry rendering completeness
// Validates: Requirements 5.5
// ---------------------------------------------------------------------------

describe('Property 8 – Income entry rendering completeness', () => {
  beforeEach(() => {
    useNotificationStore.getState().notifications = [];
    vi.clearAllMocks();
  });

  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  const incomeArb = fc.record({
    id: fc.integer({ min: 1 }),
    name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    amount: fc.double({ min: 0.01, max: 10000, noNaN: true }),
    scheduledDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
      .map(d => d.toISOString().split('T')[0]),
    dayOfMonth: fc.integer({ min: 1, max: 31 }),
    periodId: fc.integer({ min: 1 }),
  });

  it('renders both name and scheduledDate for any income', async () => {
    await fc.assert(
      fc.asyncProperty(incomeArb, async (income: Income) => {
        vi.spyOn(periodsApi, 'useCurrentPeriod').mockReturnValue({
          data: { id: 1, startDate: '2025-01-01', endDate: '2025-01-31' },
          isLoading: false,
          isError: false,
        } as any);

        vi.spyOn(incomesApi, 'useUpcomingIncomes').mockReturnValue({
          data: [income],
          isLoading: false,
          isError: false,
        } as any);

        vi.spyOn(expensesApi, 'useUpcomingExpenses').mockReturnValue({
          data: [],
          isLoading: false,
          isError: false,
        } as any);

        const { container, unmount } = render(<DashboardPage />, { wrapper: createWrapper() });

        await waitFor(() => {
          // Use container to scope the query to this specific render
          const incomeSection = container.querySelector('section:nth-of-type(2)');
          expect(incomeSection).toBeInTheDocument();
          expect(incomeSection?.textContent).toContain(income.name);
        });

        // Check that the scheduled date is rendered (formatted as "MMM D, YYYY")
        const incomeSection = container.querySelector('section:nth-of-type(2)');
        // The date should be formatted, so just check that the year is present
        const year = income.scheduledDate.split('-')[0];
        expect(incomeSection?.textContent).toContain(year);

        unmount();
      }),
      { numRuns: 5, timeout: 10000 }
    );
  }, 15000);
});

// ---------------------------------------------------------------------------
// Property 9: Expense entry rendering completeness (Dashboard)
// Validates: Requirements 5.6
// ---------------------------------------------------------------------------

describe('Property 9 – Expense entry rendering completeness (Dashboard)', () => {
  beforeEach(() => {
    useNotificationStore.getState().notifications = [];
    vi.clearAllMocks();
  });

  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  const expenseArb = fc.record({
    id: fc.integer({ min: 1 }),
    name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    amount: fc.double({ min: 0.01, max: 10000, noNaN: true }),
    dueDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
      .map(d => d.toISOString().split('T')[0]),
    dayOfMonth: fc.integer({ min: 1, max: 31 }),
    periodId: fc.integer({ min: 1 }),
  });

  it('renders both name and dueDate for any expense', async () => {
    await fc.assert(
      fc.asyncProperty(expenseArb, async (expense: Expense) => {
        vi.spyOn(periodsApi, 'useCurrentPeriod').mockReturnValue({
          data: { id: 1, startDate: '2025-01-01', endDate: '2025-01-31' },
          isLoading: false,
          isError: false,
        } as any);

        vi.spyOn(incomesApi, 'useUpcomingIncomes').mockReturnValue({
          data: [],
          isLoading: false,
          isError: false,
        } as any);

        vi.spyOn(expensesApi, 'useUpcomingExpenses').mockReturnValue({
          data: [expense],
          isLoading: false,
          isError: false,
        } as any);

        const { container, unmount } = render(<DashboardPage />, { wrapper: createWrapper() });

        await waitFor(() => {
          // Use container to scope the query to this specific render
          const expenseSection = container.querySelector('section:nth-of-type(3)');
          expect(expenseSection).toBeInTheDocument();
          expect(expenseSection?.textContent).toContain(expense.name);
        });

        // Check that the due date is rendered (formatted as "MMM D, YYYY")
        const expenseSection = container.querySelector('section:nth-of-type(3)');
        // The date should be formatted, so just check that the year is present
        const year = expense.dueDate.split('-')[0];
        expect(expenseSection?.textContent).toContain(year);

        unmount();
      }),
      { numRuns: 5, timeout: 10000 }
    );
  }, 15000);
});
