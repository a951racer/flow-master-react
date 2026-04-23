import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as fc from 'fast-check';
import { NavBar } from './NavBar';

describe('NavBar', () => {
  beforeEach(() => {
    cleanup();
  });

  // Feature: flow-master-react-frontend, Property 18: Active route navigation link is highlighted
  it('active route navigation link is highlighted', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          { path: '/', label: 'Dashboard' },
          { path: '/periods', label: 'Periods' },
          { path: '/admin', label: 'Admin' }
        ),
        (route) => {
          // Render NavBar with the specified route as active
          const { unmount } = render(
            <MemoryRouter initialEntries={[route.path]}>
              <NavBar />
            </MemoryRouter>
          );

          // Find the active link by its label
          const activeLink = screen.getByText(route.label);
          
          // Verify the active link has the active styling class
          expect(activeLink.className).toContain('text-blue-400');
          expect(activeLink.className).toContain('font-semibold');

          // Verify other links do NOT have the active styling
          const allLinks = ['Dashboard', 'Periods', 'Admin'];
          const otherLinks = allLinks.filter(label => label !== route.label);
          
          otherLinks.forEach(label => {
            const link = screen.getByText(label);
            expect(link.className).not.toContain('text-blue-400');
            expect(link.className).not.toContain('font-semibold');
            expect(link.className).toContain('text-gray-300');
          });

          // Clean up after each property test iteration
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});
