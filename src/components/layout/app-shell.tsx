import { useState } from 'react';
import { Navigate, Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as Icons from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { TitleBar } from '@/components/layout/title-bar';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/use-theme';
import { useAuthStore } from '@/stores/auth-store';
import { AccountSwitcher } from '@/components/auth/account-switcher';
import { GlobalSearch, useGlobalSearchHotkey } from '@/components/global-search';

const NAV = [
  { to: '/dashboard',  label: 'Главная',       icon: Icons.LayoutDashboard },
  { to: '/projects',   label: 'Проекты',        icon: Icons.Boxes },
  { to: '/documents',  label: 'Документация',    icon: Icons.FileText },
  { to: '/clients',    label: 'Клиенты',         icon: Icons.Users },
  { to: '/team',       label: 'Команда',         icon: Icons.User },
  { to: '/settings',   label: 'Настройки',       icon: Icons.Settings },
] as const;

export function AppShell() {
  const [theme, , toggleTheme] = useTheme();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  useGlobalSearchHotkey(() => setSearchOpen(true));

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
      <TitleBar />

      <div className="flex flex-1 overflow-hidden">
      <aside className="flex w-60 flex-col border-r border-border/60 bg-card/40">
        <div className="flex h-14 items-center gap-2 border-b border-border/60 px-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Icons.Zap className="h-4 w-4" />
          </div>
          <div className="text-sm font-semibold tracking-tight">DevOS</div>
          <div className="ml-auto text-[10px] text-muted-foreground">v0.1</div>
        </div>

        <ScrollArea className="flex-1 px-2 py-3">
          <nav className="space-y-0.5">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    isActive && 'bg-accent text-accent-foreground',
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </ScrollArea>

        <div className="border-t border-border/60 p-2">
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <div className="cursor-context-menu">
                <AccountSwitcher />
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onClick={() => navigate('/profile')}>
                Настройки профиля
              </ContextMenuItem>
              <ContextMenuItem onClick={() => navigate('/settings')}>
                Общие настройки
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-2 border-b border-border/60 px-4">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-muted-foreground"
            onClick={() => setSearchOpen(true)}
          >
            <Icons.Search className="h-3.5 w-3.5" />
            <span>Поиск…</span>
            <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
              ⌘K
            </kbd>
          </Button>
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Сменить тему">
              {theme === 'dark' ? (
                <Icons.Sun className="h-4 w-4" />
              ) : (
                <Icons.Moon className="h-4 w-4" />
              )}
            </Button>
            <Button variant="ghost" size="icon" aria-label="Уведомления">
              <Icons.Bell className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <motion.main
          key="main"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="flex-1 overflow-auto"
        >
          <Outlet />
        </motion.main>
      </div>
      </div>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
