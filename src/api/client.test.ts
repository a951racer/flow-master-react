// Feature: flow-master-react-frontend, Property 1: Bearer token present on all authenticated requests
// Validates: Requirements 1.6

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import type { InternalAxiosRequestConfig } from 'axios';
import apiClient from './client';
import { useAuthStore } from '../store/authStore';

// Arbitrary: non-empty string tokens without surrounding whitespace (simulating real JWT-like values).
// Axios normalises HTTP header values by trimming whitespace, so tokens with leading/trailing
// spaces would produce a header that doesn't match the raw token string — which is expected
// HTTP behaviour and not a bug in the interceptor.
const tokenArb = fc.string({ minLength: 1, maxLength: 256 }).filter(s => s.trim() === s && s.length > 0);

/**
 * Capture the outgoing request config by installing a one-shot adapter that
 * resolves immediately without making a real network call.
 */
function captureRequestConfig(): Promise<InternalAxiosRequestConfig> {
  return new Promise(resolve => {
    const originalAdapter = apiClient.defaults.adapter;
    apiClient.defaults.adapter = config => {
      apiClient.defaults.adapter = originalAdapter;
      resolve(config as InternalAxiosRequestConfig);
      // Return a minimal successful response so Axios doesn't throw
      return Promise.resolve({
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: config as InternalAxiosRequestConfig,
      });
    };
  });
}

describe('Property 1 – Bearer token present on all authenticated requests', () => {
  beforeEach(() => {
    useAuthStore.getState().clearToken();
  });

  it('attaches Authorization: Bearer <token> for every non-empty token stored in the auth store', async () => {
    await fc.assert(
      fc.asyncProperty(tokenArb, async token => {
        // Set the token in the auth store
        useAuthStore.getState().setToken(token);

        // Capture the config that the interceptor produces
        const configPromise = captureRequestConfig();
        apiClient.get('/test').catch(() => {/* ignore response errors */});
        const config = await configPromise;

        expect(config.headers?.['Authorization']).toBe(`Bearer ${token}`);

        useAuthStore.getState().clearToken();
      }),
      { numRuns: 100 }
    );
  });

  it('does NOT attach an Authorization header when no token is stored', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        // Ensure store is empty
        useAuthStore.getState().clearToken();

        const configPromise = captureRequestConfig();
        apiClient.get('/test').catch(() => {/* ignore */});
        const config = await configPromise;

        expect(config.headers?.['Authorization']).toBeUndefined();
      }),
      { numRuns: 10 }
    );
  });
});

// Feature: flow-master-react-frontend, Property 3: 401 response always clears token
// Validates: Requirements 2.2

describe('Property 3 – 401 response always clears token', () => {
  beforeEach(() => {
    useAuthStore.getState().clearToken();
  });

  it('clears the auth store token for any 401 response, regardless of the token value', async () => {
    // Arbitrary: non-empty string tokens without surrounding whitespace
    const tokenArb3 = fc.string({ minLength: 1, maxLength: 256 }).filter(s => s.trim() === s && s.length > 0);

    await fc.assert(
      fc.asyncProperty(tokenArb3, async token => {
        // Set a token in the auth store
        useAuthStore.getState().setToken(token);
        expect(useAuthStore.getState().token).toBe(token);

        // Install a one-shot adapter that simulates a 401 response
        const originalAdapter = apiClient.defaults.adapter;
        apiClient.defaults.adapter = config => {
          apiClient.defaults.adapter = originalAdapter;
          const err = Object.assign(new Error('Request failed with status code 401'), {
            response: {
              status: 401,
              statusText: 'Unauthorized',
              data: {},
              headers: {},
              config,
            },
            isAxiosError: true,
          });
          return Promise.reject(err);
        };

        // Fire a request and wait for the interceptor to process the 401
        await apiClient.get('/test').catch(() => {/* expected rejection */});

        // The interceptor should have cleared the token
        expect(useAuthStore.getState().token).toBeNull();
      }),
      { numRuns: 100 }
    );
  });
});
