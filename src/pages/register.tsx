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
import { useRegister } from '@/hooks/use-auth';

export function RegisterPage() {
  const navigate = useNavigate();
  const registerMutation = useRegister();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    registerMutation.mutate(
      {
        name: fd.get('name') as string,
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
            <CardTitle>Создать аккаунт</CardTitle>
            <CardDescription>30 секунд — без карты.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Имя</Label>
                <Input id="name" name="name" placeholder="Иван Иванов" autoComplete="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="you@company.com" autoComplete="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
              </div>
              {registerMutation.error && (
                <p className="text-sm text-destructive">
                  {registerMutation.error instanceof Error ? registerMutation.error.message : 'Ошибка регистрации'}
                </p>
              )}
              <Button className="w-full" type="submit" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? 'Создание…' : 'Создать аккаунт'}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground">
              Уже есть аккаунт?{' '}
              <Link to="/login" className="text-foreground underline underline-offset-4">
                Войти
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
