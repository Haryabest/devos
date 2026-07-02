import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import * as Icons from '@/components/ui/icons';
import { PageContainer } from '@/components/layout/page-container';
import { useAuthStore } from '@/stores/auth-store';
import { useChangePassword, useProfileQuery, useUpdateProfile } from '@/hooks/use-profile';
import { ApiRequestError } from '@/lib/api';

function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Выберите файл изображения (PNG, JPG, WebP).'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Не удалось прочитать файл.'));
    reader.readAsDataURL(file);
  });
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function ProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isGuest = useAuthStore((s) => s.isGuest);
  const clear = useAuthStore((s) => s.clear);
  const { loading, profile } = useProfileQuery();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl ?? null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
    setAvatarUrl(user.avatarUrl ?? null);
  }, [user?.id, user?.name, user?.email, user?.avatarUrl]);

  if (isGuest) {
    return (
      <PageContainer>
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Только для аккаунта</CardTitle>
            <CardDescription>Войдите или зарегистрируйтесь, чтобы редактировать профиль.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/login')}>Войти</Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const displayName = name.trim() || user?.name || '';
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  async function handleAvatarPick(file: File) {
    setAvatarError(null);
    try {
      const dataUrl = await readImageAsDataUrl(file);
      setAvatarUrl(dataUrl);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Не удалось загрузить изображение.');
    }
  }

  function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileMessage(null);
    setProfileError(null);
    updateProfile.mutate(
      {
        name: name.trim(),
        email: email.trim(),
        avatarUrl,
      },
      {
        onSuccess: () => setProfileMessage('Профиль сохранён.'),
        onError: (err) =>
          setProfileError(
            err instanceof ApiRequestError
              ? String(err.error.message)
              : err instanceof Error
                ? err.message
                : 'Не удалось сохранить профиль.',
          ),
      },
    );
  }

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage(null);
    setPasswordError(null);

    if (newPassword.length < 8) {
      setPasswordError('Новый пароль — минимум 8 символов.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Пароли не совпадают.');
      return;
    }

    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setPasswordMessage('Пароль изменён.');
        },
        onError: (err) =>
          setPasswordError(err instanceof Error ? err.message : 'Не удалось сменить пароль.'),
      },
    );
  }

  return (
    <PageContainer>
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Настройки профиля</h1>
        <p className="text-sm text-muted-foreground">
          Личные данные, аватар и безопасность аккаунта.
        </p>
      </header>

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-72 w-full rounded-lg" />
          <Skeleton className="h-72 w-full rounded-lg" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Личные данные</CardTitle>
              <CardDescription>Имя, email и фото профиля.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-5">
                <div className="flex flex-wrap items-center gap-4">
                  <Avatar className="h-20 w-20">
                    {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
                    <AvatarFallback className="text-xl">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Icons.Upload className="h-4 w-4" />
                      Загрузить с ПК
                    </Button>
                    {avatarUrl ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-muted-foreground"
                        onClick={() => setAvatarUrl(null)}
                      >
                        <Icons.Trash2 className="h-4 w-4" />
                        Удалить
                      </Button>
                    ) : null}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleAvatarPick(file);
                      e.target.value = '';
                    }}
                  />
                </div>
                {avatarError ? (
                  <p className="text-sm text-destructive">{avatarError}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">PNG, JPG или WebP.</p>
                )}

                <div className="space-y-2">
                  <Label htmlFor="profile-name">Имя</Label>
                  <Input
                    id="profile-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-email">Email</Label>
                  <Input
                    id="profile-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {profileMessage ? (
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">{profileMessage}</p>
                ) : null}
                {profileError ? <p className="text-sm text-destructive">{profileError}</p> : null}

                <Button type="submit" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? 'Сохранение…' : 'Сохранить'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Безопасность</CardTitle>
                <CardDescription>Смена пароля для входа в аккаунт.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Текущий пароль</Label>
                    <Input
                      id="current-password"
                      type="password"
                      autoComplete="current-password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Новый пароль</Label>
                    <Input
                      id="new-password"
                      type="password"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      minLength={8}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Подтверждение</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={8}
                      required
                    />
                  </div>

                  {passwordMessage ? (
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">{passwordMessage}</p>
                  ) : null}
                  {passwordError ? <p className="text-sm text-destructive">{passwordError}</p> : null}

                  <Button type="submit" variant="outline" disabled={changePassword.isPending}>
                    {changePassword.isPending ? 'Смена…' : 'Сменить пароль'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Аккаунт</CardTitle>
                <CardDescription>Информация и действия с сессией.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">ID</dt>
                    <dd className="mt-0.5 font-mono text-xs">{user?.id}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Регистрация</dt>
                    <dd className="mt-0.5">{formatDate(profile?.createdAt)}</dd>
                  </div>
                </dl>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => navigate('/settings')}>
                    Общие настройки
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      clear();
                      navigate('/login');
                    }}
                  >
                    Выйти из аккаунта
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
