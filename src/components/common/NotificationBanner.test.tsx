import { describe, it, expect, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { NotificationBanner } from './NotificationBanner';
import { useNotificationStore } from '../../store/notificationStore';

describe('NotificationBanner', () => {
  beforeEach(() => {
    // Clear notifications before each test
    useNotificationStore.setState({ notifications: [] });
    cleanup();
  });

  // Feature: flow-master-react-frontend, Property 21: Every notification has a dismiss mechanism
  it('every notification has a dismiss mechanism', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 10 }),
        (messages) => {
          // Clear any existing notifications
          useNotificationStore.setState({ notifications: [] });

          // Add notifications to the store
          messages.forEach(msg => useNotificationStore.getState().add(msg));

          // Render the banner
          const { container, unmount } = render(<NotificationBanner />);

          // Get all notifications from the store
          const notifications = useNotificationStore.getState().notifications;

          // Verify the number of dismiss buttons matches the number of notifications
          const dismissButtons = container.querySelectorAll('button[aria-label="Dismiss notification"]');
          expect(dismissButtons.length).toBe(notifications.length);

          // Verify each notification has at least one dismiss button
          expect(dismissButtons.length).toBeGreaterThanOrEqual(1);

          // Clean up
          unmount();
          useNotificationStore.setState({ notifications: [] });
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: flow-master-react-frontend, Property 22: Notification location is consistent across screens
  it('notification location is consistent across screens', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 5 }),
        (messages) => {
          // Clear any existing notifications
          useNotificationStore.setState({ notifications: [] });

          // Add notifications to the store
          messages.forEach(msg => useNotificationStore.getState().add(msg));

          // Render the banner
          const { container, unmount } = render(<NotificationBanner />);

          // Find the notification container
          const notificationContainer = container.querySelector('.fixed.top-4.right-4.z-50');

          // Verify the container exists and has the fixed positioning classes
          expect(notificationContainer).not.toBeNull();
          expect(notificationContainer?.classList.contains('fixed')).toBe(true);
          expect(notificationContainer?.classList.contains('top-4')).toBe(true);
          expect(notificationContainer?.classList.contains('right-4')).toBe(true);
          expect(notificationContainer?.classList.contains('z-50')).toBe(true);

          // Clean up
          unmount();
          useNotificationStore.setState({ notifications: [] });
        }
      ),
      { numRuns: 100 }
    );
  });
});
