import { create } from 'zustand';
import type { Notification } from '../types';

interface NotificationState {
  notifications: Notification[];
  add: (message: string) => void;
  dismiss: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>()(set => ({
  notifications: [],
  add: (message: string) =>
    set(state => ({
      notifications: [...state.notifications, { id: crypto.randomUUID(), message }],
    })),
  dismiss: (id: string) =>
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id),
    })),
}));
