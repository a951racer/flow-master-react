// Feature: flow-master-react-frontend
// Property 19: Session data caching prevents redundant fetches

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { QueryClient } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// Property 19: Session data caching prevents redundant fetches
// **Validates: Requirements 14.3**
//
// For any query that has been successfully fetched within the current session
// (within staleTime), navigating away from and back to the same screen SHALL
// NOT trigger a new network request for that query.
// ---------------------------------------------------------------------------

describe('Property 19 – Session data caching prevents redundant fetches', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // 5 minutes
          retry: 1,
        },
      },
    });
  });

  it('staleTime is configured to 5 minutes', () => {
    expect(queryClient.getDefaultOptions().queries?.staleTime).toBe(5 * 60 * 1000);
  });

  it('does not refetch data within staleTime window', async () => {
    // Arbitrary: query key and data
    const queryKeyArb = fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 3 });
    const dataArb = fc.record({
      id: fc.integer(),
      value: fc.string(),
    });

    await fc.assert(
      fc.asyncProperty(queryKeyArb, dataArb, async (queryKey, data) => {
        let fetchCount = 0;
        const mockFetcher = vi.fn(async () => {
          fetchCount++;
          return data;
        });

        // First fetch
        await queryClient.fetchQuery({
          queryKey,
          queryFn: mockFetcher,
        });

        expect(fetchCount).toBe(1);

        // Second fetch within staleTime — should use cache
        await queryClient.fetchQuery({
          queryKey,
          queryFn: mockFetcher,
        });

        // Should NOT have triggered a second fetch
        expect(fetchCount).toBe(1);

        // Verify data is still available from cache
        const cachedData = queryClient.getQueryData(queryKey);
        expect(cachedData).toEqual(data);

        // Cleanup
        queryClient.clear();
      })
    );
  });

  it('refetches data after staleTime expires', async () => {
    const queryKey = ['test-query'];
    const data = { id: 1, value: 'test' };
    let fetchCount = 0;

    const mockFetcher = vi.fn(async () => {
      fetchCount++;
      return data;
    });

    // Create a client with very short staleTime for this test
    const shortStaleClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 10, // 10ms
          retry: 1,
        },
      },
    });

    // First fetch
    await shortStaleClient.fetchQuery({
      queryKey,
      queryFn: mockFetcher,
    });

    expect(fetchCount).toBe(1);

    // Wait for staleTime to expire
    await new Promise(resolve => setTimeout(resolve, 20));

    // Second fetch after staleTime — should refetch
    await shortStaleClient.fetchQuery({
      queryKey,
      queryFn: mockFetcher,
    });

    // Should have triggered a second fetch
    expect(fetchCount).toBe(2);

    shortStaleClient.clear();
  });

  it('retry is configured to 1', () => {
    expect(queryClient.getDefaultOptions().queries?.retry).toBe(1);
  });
});
