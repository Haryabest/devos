import { Link, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TitleBar } from '@/components/layout/title-bar';
import { SavedAccountsPanel } from '@/components/auth/saved-accounts-panel';
import { useAuthStore } from '@/stores/auth-store';
import { useLogin } from '@/hooks/use-auth';

export function LoginPage() {
  const { setGuest } = useAuthStore();
  const navigate = useNavigate();
  const loginMutation = useLogin();

  function handleGuest() {
    setGuest();
    navigate('/dashboard');
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    loginMutation.mutate(
      {
        email: fd.get('email') as string,
        password: fd.get('password') as string,
      },
      { onSuccess: () => navigate('/dashboard') },
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <TitleBar />
      <div className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Войти в DevOS</CardTitle>
            <CardDescription>AI-воркспейс для разработки</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SavedAccountsPanel />

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="you@company.com" autoComplete="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input id="password" name="password" type="password" autoComplete="current-password" required />
              </div>
              {loginMutation.error && (
                <p className="text-sm text-destructive">
                  {loginMutation.error instanceof Error ? loginMutation.error.message : 'Ошибка входа'}
                </p>
              )}
              <Button className="w-full" type="submit" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? 'Вход…' : 'Войти'}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">или</span>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={handleGuest}>
              Войти как гость
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Локальный режим без backend. Данные хранятся на этом устройстве.
            </p>

            <p className="text-center text-sm text-muted-foreground">
              Нет аккаунта?{' '}
              <Link to="/register" className="text-foreground underline underline-offset-4">
                Зарегистрироваться
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
