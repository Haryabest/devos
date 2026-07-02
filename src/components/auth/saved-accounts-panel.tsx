import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { listSavedAccounts, type SavedAccount } from '@/lib/saved-accounts';
import { useSwitchAccount } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function AccountRow({
  account,
  compact,
  onSelect,
  pending,
}: {
  account: SavedAccount;
  compact?: boolean;
  onSelect: (account: SavedAccount) => void;
  pending: boolean;
}) {
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => onSelect(account)}
      className={cn(
        'flex w-full items-center gap-3 rounded-md border border-border/60 bg-muted/20 px-3 text-left transition-colors',
        'hover:bg-accent hover:text-accent-foreground disabled:opacity-60',
        compact ? 'py-2' : 'py-2.5',
      )}
    >
      <Avatar className="h-8 w-8">
        {account.avatarUrl ? <AvatarImage src={account.avatarUrl} alt={account.name} /> : null}
        <AvatarFallback className="text-xs">{initials(account.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{account.name}</div>
        <div className="truncate text-xs text-muted-foreground">{account.email}</div>
      </div>
    </button>
  );
}

export function SavedAccountsPanel({
  redirectTo = '/dashboard',
  showHeading = true,
}: {
  redirectTo?: string;
  showHeading?: boolean;
}) {
  const navigate = useNavigate();
  const switchMutation = useSwitchAccount();
  const accounts = useMemo(() => listSavedAccounts(), []);

  if (accounts.length === 0) return null;

  const [lastAccount, ...otherAccounts] = accounts;

  function handleSelect(account: SavedAccount) {
    switchMutation.mutate(account, {
      onSuccess: () => navigate(redirectTo),
    });
  }

  return (
    <div className="space-y-3">
      {showHeading && (
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Сохранённые аккаунты
        </p>
      )}

      {lastAccount && (
        <Button
          type="button"
          variant="secondary"
          className="h-auto w-full justify-start gap-3 px-3 py-2.5"
          disabled={switchMutation.isPending}
          onClick={() => handleSelect(lastAccount)}
        >
          <Avatar className="h-8 w-8">
            {lastAccount.avatarUrl ? (
              <AvatarImage src={lastAccount.avatarUrl} alt={lastAccount.name} />
            ) : null}
            <AvatarFallback className="text-xs">{initials(lastAccount.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 text-left">
            <div className="truncate text-sm font-medium">
              {switchMutation.isPending ? 'Вход…' : `Продолжить как ${lastAccount.name}`}
            </div>
            <div className="truncate text-xs text-muted-foreground">{lastAccount.email}</div>
          </div>
        </Button>
      )}

      {otherAccounts.length > 0 && (
        <div className="space-y-2">
          {otherAccounts.map((account) => (
            <AccountRow
              key={account.userId}
              account={account}
              compact
              pending={switchMutation.isPending}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}

      {switchMutation.error && (
        <p className="text-sm text-destructive">
          {switchMutation.error instanceof Error
            ? switchMutation.error.message
            : 'Не удалось войти в аккаунт'}
        </p>
      )}

      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">или</span>
        </div>
      </div>
    </div>
  );
}
