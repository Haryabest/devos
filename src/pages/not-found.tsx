import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
      <div className="text-6xl font-semibold">404</div>
      <p className="text-sm text-muted-foreground">Страница не найдена.</p>
      <Button asChild variant="outline">
        <Link to="/dashboard">На главную</Link>
      </Button>
    </div>
  );
}
