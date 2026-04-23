import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import * as fc from 'fast-check';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuthStore } from '../../store/authStore';

describe('ProtectedRoute', () => {
  beforeEach(() => {
    // Clear token before each test
    useAuthStore.getState().clearToken();
    cleanup();
  });

  // Feature: flow-master-react-frontend, Property 2: Unauthenticated navigation always redirects to login
  it('unauthenticated navigation always redirects to login', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('/', '/dashboard', '/periods', '/admin', '/settings', '/profile'),
        (routePath) => {
          // Ensure no token is present
          useAuthStore.getState().clearToken();

          // Render the protected route with a test component
          const { unmount } = render(
            <MemoryRouter initialEntries={[routePath]}>
              <Routes>
                <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
                <Route element={<ProtectedRoute />}>
                  <Route path="*" element={<div data-testid="protected-content">Protected Content</div>} />
                </Route>
              </Routes>
            </MemoryRouter>
          );

          // Verify that we're redirected to the login page
          const loginPage = screen.queryByTestId('login-page');
          const protectedContent = screen.queryByTestId('protected-content');

          expect(loginPage).not.toBeNull();
          expect(protectedContent).toBeNull();

          // Clean up after each property test iteration
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('authenticated navigation renders protected content', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('/', '/dashboard', '/periods', '/admin'),
        fc.string({ minLength: 10 }),
        (routePath, token) => {
          // Set a valid token
          useAuthStore.getState().setToken(token);

          // Render the protected route
          const { unmount } = render(
            <MemoryRouter initialEntries={[routePath]}>
              <Routes>
                <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
                <Route element={<ProtectedRoute />}>
                  <Route path="*" element={<div data-testid="protected-content">Protected Content</div>} />
                </Route>
              </Routes>
            </MemoryRouter>
          );

          // Verify that protected content is rendered
          const loginPage = screen.queryByTestId('login-page');
          const protectedContent = screen.queryByTestId('protected-content');

          expect(loginPage).toBeNull();
          expect(protectedContent).not.toBeNull();

          // Clean up after each property test iteration
          unmount();
          useAuthStore.getState().clearToken();
        }
      ),
      { numRuns: 100 }
    );
  });
});
