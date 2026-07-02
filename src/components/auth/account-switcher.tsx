import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Icons from '@/components/ui/icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { listSavedAccounts, removeSavedAccount, type SavedAccount } from '@/lib/saved-accounts';
import { useSwitchAccount } from '@/hooks/use-auth';
import { useAuthStore, GUEST_USER } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function AccountSwitcher() {
  const navigate = useNavigate();
  const { user, isGuest, setGuest, clear } = useAuthStore();
  const switchMutation = useSwitchAccount();
  const [open, setOpen] = useState(false);
  const accounts = useMemo(() => listSavedAccounts(), [open, user?.id]);

  function handleSwitch(account: SavedAccount) {
    if (account.userId === user?.id) {
      setOpen(false);
      return;
    }
    switchMutation.mutate(account, {
      onSuccess: () => {
        setOpen(false);
        navigate('/dashboard');
      },
    });
  }

  function handleGuest() {
    setGuest();
    setOpen(false);
    navigate('/dashboard');
  }

  function handleLogout() {
    clear();
    setOpen(false);
    navigate('/login');
  }

  function handleRemove(account: SavedAccount, e: React.MouseEvent) {
    e.stopPropagation();
    removeSavedAccount(account.userId);
    if (account.userId === user?.id) {
      clear();
      navigate('/login');
    }
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-md p-2 text-left hover:bg-accent/50"
        >
          <Avatar>
            {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.name} /> : null}
            <AvatarFallback>{user ? initials(user.name) : '?'}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-medium">{user?.name ?? 'Гость'}</span>
              {isGuest && (
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                  Гость
                </Badge>
              )}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {isGuest ? 'Нажмите, чтобы сменить аккаунт' : (user?.email ?? '')}
            </div>
          </div>
          <Icons.ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" side="top" className="w-72 p-2">
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Аккаунты</div>
        <div className="space-y-1">
          {accounts.map((account) => {
            const active = !isGuest && account.userId === user?.id;
            return (
              <div key={account.userId} className="group relative">
                <button
                  type="button"
                  disabled={switchMutation.isPending}
                  onClick={() => handleSwitch(account)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors',
                    'hover:bg-accent hover:text-accent-foreground disabled:opacity-60',
                    active && 'bg-accent/70',
                  )}
                >
                  <Avatar className="h-7 w-7">
                    {account.avatarUrl ? (
                      <AvatarImage src={account.avatarUrl} alt={account.name} />
                    ) : null}
                    <AvatarFallback className="text-[10px]">{initials(account.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{account.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{account.email}</div>
                  </div>
                  {active && <Icons.Check className="h-4 w-4 shrink-0 text-primary" />}
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 opacity-0 group-hover:opacity-100"
                  aria-label="Удалить аккаунт из списка"
                  onClick={(e) => handleRemove(account, e)}
                >
                  <Icons.X className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}

          {isGuest && (
            <div
              className={cn(
                'flex items-center gap-2 rounded-md bg-accent/70 px-2 py-2',
              )}
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-[10px]">{initials(GUEST_USER.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm">{GUEST_USER.name}</div>
                <div className="truncate text-xs text-muted-foreground">Локальный режим</div>
              </div>
              <Icons.Check className="h-4 w-4 shrink-0 text-primary" />
            </div>
          )}
        </div>

        {switchMutation.error && (
          <p className="px-2 pt-2 text-xs text-destructive">
            {switchMutation.error instanceof Error
              ? switchMutation.error.message
              : 'Не удалось переключить аккаунт'}
          </p>
        )}

        <div className="my-2 border-t border-border" />

        <div className="space-y-1">
          {!isGuest && (
            <button
              type="button"
              onClick={handleGuest}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent"
            >
              <Icons.User className="h-4 w-4" />
              Войти как гость
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate('/login');
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent"
          >
            <Icons.LogIn className="h-4 w-4" />
            Другой аккаунт
          </button>
          {!isGuest && (
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-destructive hover:bg-destructive/10"
            >
              <Icons.LogOut className="h-4 w-4" />
              Выйти
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
