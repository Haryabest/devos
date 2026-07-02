import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import * as Icons from '@/components/ui/icons';
import type { Recommendation } from '@/features/dashboard/types';

type RecommendationsCardProps = {
  hasProjects: boolean;
  recommendations: Recommendation[];
};

export function RecommendationsCard({ hasProjects, recommendations }: RecommendationsCardProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icons.Bell className="h-4 w-4" />
          Рекомендации
        </CardTitle>
        <CardDescription>Что улучшить в проекте.</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasProjects ? (
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>DevOS = AI-first система для разработки. Начните с проекта.</p>
            <Button size="sm" onClick={() => navigate('/projects')} className="gap-2">
              <Icons.Plus className="h-4 w-4" />
              Создать проект
            </Button>
          </div>
        ) : recommendations.length === 0 ? (
          <p className="text-sm text-muted-foreground">Всё в порядке — контекст в норме.</p>
        ) : (
          <ul className="space-y-3">
            {recommendations.map((r, i) => (
              <li
                key={i}
                className="flex items-start justify-between gap-3 rounded-md border border-border/60 bg-muted/20 px-3 py-2.5 text-sm"
              >
                <span>{r.text}</span>
                {r.action && r.label && (
                  <Button size="sm" variant="outline" className="shrink-0 h-7 text-xs" onClick={r.action}>
                    {r.label}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
