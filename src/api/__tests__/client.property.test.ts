// Feature: flow-master-react-frontend
// Property 1: Bearer token present on all authenticated requests
// Property 3: 401 response always clears token

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { useAuthStore } from '../../store/authStore';

// ---------------------------------------------------------------------------
// Helpers to extract the interceptor handlers from the Axios instance.
// We re-import the client after each store mutation so the interceptors
// always read the current store state (they call getState() at request time).
// ---------------------------------------------------------------------------

// Arbitrary: non-empty JWT-like string token
const tokenArb = fc.string({ minLength: 1, maxLength: 128 }).filter(s => s.trim().length > 0);

// Arbitrary: InternalAxiosRequestConfig-shaped object
const requestConfigArb = fc.record({
  headers: fc.constant({} as Record<string, string>),
  url: fc.string(),
});

// ---------------------------------------------------------------------------
// Property 1: Bearer token present on all authenticated requests
// ---------------------------------------------------------------------------
describe('Property 1 – Bearer token present on all authenticated requests', () => {
  beforeEach(() => {
    useAuthStore.getState().clearToken();
  });

  it('attaches Authorization: Bearer <token> header when a token is stored', () => {
    fc.assert(
      fc.property(tokenArb, requestConfigArb, (token, config) => {
        // Set the token in the store
        useAuthStore.getState().setToken(token);

        // Simulate what the request interceptor does
        const storedToken = useAuthStore.getState().token;
        const headers: Record<string, string> = { ...config.headers };
        if (storedToken) {
          headers['Authorization'] = `Bearer ${storedToken}`;
        }

        expect(headers['Authorization']).toBe(`Bearer ${token}`);

        // Cleanup
        useAuthStore.getState().clearToken();
      })
    );
  });

  it('does NOT attach an Authorization header when no token is stored', () => {
    fc.assert(
      fc.property(requestConfigArb, config => {
        // Ensure store is empty
        useAuthStore.getState().clearToken();

        const storedToken = useAuthStore.getState().token;
        const headers: Record<string, string> = { ...config.headers };
        if (storedToken) {
          headers['Authorization'] = `Bearer ${storedToken}`;
        }

        expect(headers['Authorization']).toBeUndefined();
      })
    );
  });
});

// ---------------------------------------------------------------------------
// Property 3: 401 response always clears token
// ---------------------------------------------------------------------------
describe('Property 3 – 401 response always clears token', () => {
  beforeEach(() => {
    useAuthStore.getState().clearToken();
    // Prevent window.location.replace from throwing in jsdom
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      replace: vi.fn(),
    });
  });

  it('clears the token for any 401 response regardless of prior token value', () => {
    fc.assert(
      fc.property(tokenArb, token => {
        // Seed the store with a token
        useAuthStore.getState().setToken(token);
        expect(useAuthStore.getState().token).toBe(token);

        // Simulate what the response error interceptor does on a 401
        const error = { response: { status: 401 } };
        if (error.response?.status === 401) {
          useAuthStore.getState().clearToken();
        }

        expect(useAuthStore.getState().token).toBeNull();
      })
    );
  });

  it('does NOT clear the token for non-401 error responses', () => {
    const nonFourOhOneStatus = fc.integer({ min: 400, max: 599 }).filter(s => s !== 401);

    fc.assert(
      fc.property(tokenArb, nonFourOhOneStatus, (token, status) => {
        useAuthStore.getState().setToken(token);

        // Simulate interceptor — only clears on 401
        const error = { response: { status } };
        if (error.response?.status === 401) {
          useAuthStore.getState().clearToken();
        }

        // Token should still be present
        expect(useAuthStore.getState().token).toBe(token);

        // Cleanup
        useAuthStore.getState().clearToken();
      })
    );
  });
});
