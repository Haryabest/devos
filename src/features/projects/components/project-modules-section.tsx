import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import * as Icons from '@/components/ui/icons';
import { cn } from '@/lib/utils';

type ProjectModule = {
  label: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
};

type ProjectModulesSectionProps = {
  modules: ProjectModule[];
  className?: string;
};

export function ProjectModulesSection({ modules, className }: ProjectModulesSectionProps) {
  const navigate = useNavigate();

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {modules.map((m) => (
        <Card
          key={m.label}
          onClick={() => navigate(m.to)}
          className="group cursor-pointer transition-colors hover:border-primary/50"
        >
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <m.icon className="h-4 w-4" />
              {m.label}
            </CardDescription>
            <CardTitle className="text-3xl">{m.count}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-1 text-xs text-primary">
            Открыть
            <Icons.ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
