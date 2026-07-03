import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import * as Icons from '@/components/ui/icons';
import { useNotificationsStore } from '@/stores/notifications-store';

export function NotificationsPanel() {
  const navigate = useNavigate();
  const items = useNotificationsStore((s) => s.items);
  const unread = useNotificationsStore((s) => s.unreadCount());
  const markRead = useNotificationsStore((s) => s.markRead);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const remove = useNotificationsStore((s) => s.remove);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Уведомления" className="relative">
          <Icons.Bell className="h-4 w-4" />
          {unread > 0 && (
            <Badge className="absolute -right-0.5 -top-0.5 h-4 min-w-4 px-1 text-[10px]">
              {unread > 9 ? '9+' : unread}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-medium">Уведомления</span>
          {unread > 0 && (
            <button type="button" className="text-xs text-primary" onClick={markAllRead}>
              Прочитать все
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">Пока пусто</p>
          ) : (
            items.slice(0, 8).map((n) => (
              <button
                key={n.id}
                type="button"
                className="flex w-full flex-col items-start gap-0.5 border-b border-border/40 px-3 py-2 text-left hover:bg-muted/50"
                onClick={() => {
                  markRead(n.id);
                  if (n.href) navigate(n.href);
                }}
              >
                <span className={`text-sm font-medium ${n.read ? 'text-muted-foreground' : ''}`}>
                  {n.title}
                </span>
                <span className="text-xs text-muted-foreground line-clamp-2">{n.body}</span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(n.createdAt).toLocaleString('ru-RU')}
                </span>
              </button>
            ))
          )}
        </div>
        {items.length > 0 && (
          <div className="border-t px-3 py-2">
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => items.forEach((n) => remove(n.id))}
            >
              Очистить все
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function useNotificationScanner() {
  const push = useNotificationsStore((s) => s.push);

  useEffect(() => {
    void import('@/lib/automation-engine').then((m) => m.runAutomationEngine(push));
    const interval = setInterval(() => {
      void import('@/lib/automation-engine').then((m) => m.runAutomationEngine(push));
    }, 60_000);
    return () => clearInterval(interval);
  }, [push]);
}
