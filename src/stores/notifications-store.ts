import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createScopedPersistStorage } from '@/lib/scoped-storage';

export type NotificationKind = 'invite' | 'deadline' | 'mention' | 'sync' | 'info';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: string;
}

interface NotificationsState {
  items: AppNotification[];
  push: (item: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  remove: (id: string) => void;
  unreadCount: () => number;
}

function uid() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      items: [],
      push: (item) => {
        const next: AppNotification = {
          ...item,
          id: uid(),
          read: false,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ items: [next, ...s.items].slice(0, 50) }));
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(item.title, { body: item.body });
        }
      },
      markRead: (id) =>
        set((s) => ({ items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
      markAllRead: () => set((s) => ({ items: s.items.map((n) => ({ ...n, read: true })) })),
      remove: (id) => set((s) => ({ items: s.items.filter((n) => n.id !== id) })),
      unreadCount: () => get().items.filter((n) => !n.read).length,
    }),
    {
      name: 'devos:notifications',
      skipHydration: true,
      storage: createJSONStorage(() => createScopedPersistStorage('devos:notifications')),
      version: 1,
    },
  ),
);

export function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'default') {
    void Notification.requestPermission();
  }
}
