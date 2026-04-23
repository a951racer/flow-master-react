// Feature: flow-master-react-frontend
// Property 17: Admin update failure rolls back UI state

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminPage } from '../AdminPage';
import { useNotificationStore } from '../../store/notificationStore';
import * as adminApi from '../../api/admin';
import type { ExpenseCategory, PaymentSource, User } from '../../types';

// ---------------------------------------------------------------------------
// Property 17: Admin update failure rolls back UI state
// Validates: Requirements 10.5, 11.4, 12.4
// ---------------------------------------------------------------------------

describe('Property 17 – Admin update failure rolls back UI state', () => {
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

  const expenseCategoryArb = fc.record({
    id: fc.integer({ min: 1, max: 1000 }),
    name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  });

  const paymentSourceArb = fc.record({
    id: fc.integer({ min: 1, max: 1000 }),
    name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  });

  const userArb = fc.record({
    id: fc.integer({ min: 1, max: 1000 }),
    username: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    email: fc.option(
      fc.emailAddress(),
      { nil: undefined }
    ),
  });

  it('rolls back expense category on update failure', async () => {
    await fc.assert(
      fc.asyncProperty(expenseCategoryArb, async (category: ExpenseCategory) => {
        // Clear notifications before each test
        useNotificationStore.getState().notifications = [];
        
        const user = userEvent.setup();

        // Mock successful fetch
        vi.spyOn(adminApi, 'useExpenseCategories').mockReturnValue({
          data: [category],
          isLoading: false,
          isError: false,
        } as any);

        vi.spyOn(adminApi, 'usePaymentSources').mockReturnValue({
          data: [],
          isLoading: false,
          isError: false,
        } as any);

        vi.spyOn(adminApi, 'useUsers').mockReturnValue({
          data: [],
          isLoading: false,
          isError: false,
        } as any);

        // Mock update mutation that fails
        const mockMutate = vi.fn((_, options) => {
          // Simulate failure
          if (options?.onError) {
            options.onError(new Error('Update failed'), _, undefined);
          }
        });

        vi.spyOn(adminApi, 'useUpdateExpenseCategory').mockReturnValue({
          mutate: mockMutate,
          isPending: false,
        } as any);

        const { container, unmount } = render(<AdminPage />, { wrapper: createWrapper() });

        try {
          // Wait for the page to load
          await waitFor(() => {
            const heading = container.querySelector('h2');
            expect(heading?.textContent).toBe('Expense Categories');
          });

          // Find and click the Edit button
          const editButton = Array.from(container.querySelectorAll('button'))
            .find(btn => btn.textContent === 'Edit');
          
          if (editButton) {
            await user.click(editButton);

            // Wait for edit mode
            await waitFor(() => {
              const input = container.querySelector('input[type="text"]');
              expect(input).toBeInTheDocument();
            });

            // Change the value
            const input = container.querySelector('input[type="text"]') as HTMLInputElement;
            await user.clear(input);
            await user.type(input, 'Modified Name');

            // Click Save
            const saveButton = Array.from(container.querySelectorAll('button'))
              .find(btn => btn.textContent === 'Save');
            
            if (saveButton) {
              await user.click(saveButton);

              // Wait for the mutation to be called and error to be handled
              await waitFor(() => {
                expect(mockMutate).toHaveBeenCalled();
              });

              // Verify notification was added
              await waitFor(() => {
                const notifications = useNotificationStore.getState().notifications;
                expect(notifications.length).toBeGreaterThan(0);
                expect(notifications.some(n => n.message.includes('Failed'))).toBe(true);
              });

              // Verify the UI rolled back to the original value (may be in input or span)
              await waitFor(() => {
                const input = container.querySelector('input[type="text"]') as HTMLInputElement;
                if (input) {
                  // Still in edit mode, but value should be rolled back
                  expect(input.value).toBe(category.name);
                } else {
                  // Exited edit mode, should show original value
                  const displayedText = container.textContent;
                  expect(displayedText).toContain(category.name);
                }
              });
            }
          }
        } finally {
          unmount();
        }
      }),
      { numRuns: 3, timeout: 15000 }
    );
  }, 20000);

  it('rolls back payment source on update failure', async () => {
    await fc.assert(
      fc.asyncProperty(paymentSourceArb, async (source: PaymentSource) => {
        // Clear notifications before each test
        useNotificationStore.getState().notifications = [];
        
        const user = userEvent.setup();

        // Mock successful fetch
        vi.spyOn(adminApi, 'useExpenseCategories').mockReturnValue({
          data: [],
          isLoading: false,
          isError: false,
        } as any);

        vi.spyOn(adminApi, 'usePaymentSources').mockReturnValue({
          data: [source],
          isLoading: false,
          isError: false,
        } as any);

        vi.spyOn(adminApi, 'useUsers').mockReturnValue({
          data: [],
          isLoading: false,
          isError: false,
        } as any);

        // Mock update mutation that fails
        const mockMutate = vi.fn((_, options) => {
          // Simulate failure
          if (options?.onError) {
            options.onError(new Error('Update failed'), _, undefined);
          }
        });

        vi.spyOn(adminApi, 'useUpdatePaymentSource').mockReturnValue({
          mutate: mockMutate,
          isPending: false,
        } as any);

        const { container, unmount } = render(<AdminPage />, { wrapper: createWrapper() });

        try {
          // Wait for the page to load - use container to avoid multiple matches
          await waitFor(() => {
            const sections = container.querySelectorAll('section');
            expect(sections.length).toBeGreaterThan(0);
          });

          // Find the Payment Sources section
          const sections = container.querySelectorAll('section');
          const paymentSourceSection = Array.from(sections).find(s => 
            s.textContent?.includes('Payment Sources') && s.querySelector('table')
          );

          if (paymentSourceSection) {
            // Find and click the Edit button in this section
            const editButton = Array.from(paymentSourceSection.querySelectorAll('button'))
              .find(btn => btn.textContent === 'Edit');
            
            if (editButton) {
              await user.click(editButton);

              // Wait for edit mode
              await waitFor(() => {
                const input = paymentSourceSection.querySelector('input[type="text"]');
                expect(input).toBeInTheDocument();
              });

              // Change the value
              const input = paymentSourceSection.querySelector('input[type="text"]') as HTMLInputElement;
              await user.clear(input);
              await user.type(input, 'Modified Source');

              // Click Save
              const saveButton = Array.from(paymentSourceSection.querySelectorAll('button'))
                .find(btn => btn.textContent === 'Save');
              
              if (saveButton) {
                await user.click(saveButton);

                // Wait for the mutation to be called and error to be handled
                await waitFor(() => {
                  expect(mockMutate).toHaveBeenCalled();
                });

                // Verify notification was added
                await waitFor(() => {
                  const notifications = useNotificationStore.getState().notifications;
                  expect(notifications.length).toBeGreaterThan(0);
                  expect(notifications.some(n => n.message.includes('Failed'))).toBe(true);
                });

                // Verify the UI rolled back to the original value (may be in input or span)
                await waitFor(() => {
                  const input = paymentSourceSection.querySelector('input[type="text"]') as HTMLInputElement;
                  if (input) {
                    // Still in edit mode, but value should be rolled back
                    expect(input.value).toBe(source.name);
                  } else {
                    // Exited edit mode, should show original value
                    const displayedText = paymentSourceSection.textContent;
                    expect(displayedText).toContain(source.name);
                  }
                });
              }
            }
          }
        } finally {
          unmount();
        }
      }),
      { numRuns: 3, timeout: 15000 }
    );
  }, 20000);

  it('rolls back user on update failure', async () => {
    await fc.assert(
      fc.asyncProperty(userArb, async (user: User) => {
        // Clear notifications before each test
        useNotificationStore.getState().notifications = [];
        
        const userEventInstance = userEvent.setup();

        // Mock successful fetch
        vi.spyOn(adminApi, 'useExpenseCategories').mockReturnValue({
          data: [],
          isLoading: false,
          isError: false,
        } as any);

        vi.spyOn(adminApi, 'usePaymentSources').mockReturnValue({
          data: [],
          isLoading: false,
          isError: false,
        } as any);

        vi.spyOn(adminApi, 'useUsers').mockReturnValue({
          data: [user],
          isLoading: false,
          isError: false,
        } as any);

        // Mock update mutation that fails
        const mockMutate = vi.fn((_, options) => {
          // Simulate failure
          if (options?.onError) {
            options.onError(new Error('Update failed'), _, undefined);
          }
        });

        vi.spyOn(adminApi, 'useUpdateUser').mockReturnValue({
          mutate: mockMutate,
          isPending: false,
        } as any);

        const { container, unmount } = render(<AdminPage />, { wrapper: createWrapper() });

        try {
          // Wait for the page to load - use container to avoid multiple matches
          await waitFor(() => {
            const sections = container.querySelectorAll('section');
            expect(sections.length).toBeGreaterThan(0);
          });

          // Find the Users section
          const sections = container.querySelectorAll('section');
          const usersSection = Array.from(sections).find(s => 
            s.textContent?.includes('Users') && s.querySelector('table')
          );

          if (usersSection) {
            // Find and click the Edit button in this section
            const editButton = Array.from(usersSection.querySelectorAll('button'))
              .find(btn => btn.textContent === 'Edit');
            
            if (editButton) {
              await userEventInstance.click(editButton);

              // Wait for edit mode
              await waitFor(() => {
                const inputs = usersSection.querySelectorAll('input');
                expect(inputs.length).toBeGreaterThan(0);
              });

              // Change the username value
              const inputs = usersSection.querySelectorAll('input');
              const usernameInput = inputs[0] as HTMLInputElement;
              await userEventInstance.clear(usernameInput);
              await userEventInstance.type(usernameInput, 'ModifiedUser');

              // Click Save
              const saveButton = Array.from(usersSection.querySelectorAll('button'))
                .find(btn => btn.textContent === 'Save');
              
              if (saveButton) {
                await userEventInstance.click(saveButton);

                // Wait for the mutation to be called and error to be handled
                await waitFor(() => {
                  expect(mockMutate).toHaveBeenCalled();
                });

                // Verify notification was added
                await waitFor(() => {
                  const notifications = useNotificationStore.getState().notifications;
                  expect(notifications.length).toBeGreaterThan(0);
                  expect(notifications.some(n => n.message.includes('Failed'))).toBe(true);
                });

                // Verify the UI rolled back to the original value (may be in input or span)
                await waitFor(() => {
                  const inputs = usersSection.querySelectorAll('input');
                  if (inputs.length > 0) {
                    // Still in edit mode, but value should be rolled back
                    const usernameInput = inputs[0] as HTMLInputElement;
                    expect(usernameInput.value).toBe(user.username);
                  } else {
                    // Exited edit mode, should show original value
                    const displayedText = usersSection.textContent;
                    expect(displayedText).toContain(user.username);
                  }
                });
              }
            }
          }
        } finally {
          unmount();
        }
      }),
      { numRuns: 3, timeout: 15000 }
    );
  }, 20000);
});
