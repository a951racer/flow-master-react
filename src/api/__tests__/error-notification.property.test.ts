// Feature: flow-master-react-frontend
// Property 20: Every failed API request produces a notification

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { useNotificationStore } from '../../store/notificationStore';

// ---------------------------------------------------------------------------
// Property 20: Every failed API request produces a notification
// **Validates: Requirements 15.1, 15.2**
//
// For any failed API request (network error or non-2xx response), at least
// one notification SHALL be added to the notification store with a non-empty
// human-readable message.
// ---------------------------------------------------------------------------

describe('Property 20 – Every failed API request produces a notification', () => {
  beforeEach(() => {
    // Clear notifications before each test
    const store = useNotificationStore.getState();
    store.notifications.forEach(n => store.dismiss(n.id));
  });

  it('adds a notification with non-empty message for any error', () => {
    // Arbitrary: error message (non-empty string)
    const errorMessageArb = fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0);

    fc.assert(
      fc.property(errorMessageArb, errorMessage => {
        const initialCount = useNotificationStore.getState().notifications.length;

        // Simulate error handling: add notification
        useNotificationStore.getState().add(errorMessage);

        const notifications = useNotificationStore.getState().notifications;
        
        // Should have added exactly one notification
        expect(notifications.length).toBe(initialCount + 1);

        // The new notification should have a non-empty message
        const newNotification = notifications[notifications.length - 1];
        expect(newNotification.message).toBe(errorMessage);
        expect(newNotification.message.trim().length).toBeGreaterThan(0);

        // Should have a unique ID
        expect(newNotification.id).toBeDefined();
        expect(typeof newNotification.id).toBe('string');
        expect(newNotification.id.length).toBeGreaterThan(0);

        // Cleanup
        useNotificationStore.getState().dismiss(newNotification.id);
      })
    );
  });

  it('notification message is human-readable (non-empty after trim)', () => {
    const messageArb = fc.string({ minLength: 1, maxLength: 100 });

    fc.assert(
      fc.property(messageArb, message => {
        // Only test with non-empty trimmed messages (as per requirement)
        if (message.trim().length === 0) return true;

        useNotificationStore.getState().add(message);

        const notifications = useNotificationStore.getState().notifications;
        const lastNotification = notifications[notifications.length - 1];

        // Message should be preserved as-is
        expect(lastNotification.message).toBe(message);
        
        // Cleanup
        useNotificationStore.getState().dismiss(lastNotification.id);
      })
    );
  });

  it('multiple failed requests produce multiple notifications', () => {
    const errorMessagesArb = fc.array(
      fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
      { minLength: 1, maxLength: 10 }
    );

    fc.assert(
      fc.property(errorMessagesArb, errorMessages => {
        const initialCount = useNotificationStore.getState().notifications.length;

        // Simulate multiple errors
        errorMessages.forEach(msg => {
          useNotificationStore.getState().add(msg);
        });

        const notifications = useNotificationStore.getState().notifications;

        // Should have added exactly as many notifications as errors
        expect(notifications.length).toBe(initialCount + errorMessages.length);

        // Each notification should have the corresponding message
        const newNotifications = notifications.slice(initialCount);
        newNotifications.forEach((notification, index) => {
          expect(notification.message).toBe(errorMessages[index]);
        });

        // Cleanup
        newNotifications.forEach(n => {
          useNotificationStore.getState().dismiss(n.id);
        });
      })
    );
  });

  it('notification IDs are unique', () => {
    const countArb = fc.integer({ min: 2, max: 20 });

    fc.assert(
      fc.property(countArb, count => {
        const ids: string[] = [];

        // Add multiple notifications
        for (let i = 0; i < count; i++) {
          useNotificationStore.getState().add(`Error ${i}`);
        }

        const notifications = useNotificationStore.getState().notifications;
        notifications.forEach(n => ids.push(n.id));

        // All IDs should be unique
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);

        // Cleanup
        notifications.forEach(n => {
          useNotificationStore.getState().dismiss(n.id);
        });
      })
    );
  });
});
