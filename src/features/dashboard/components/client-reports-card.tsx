import { differenceInCalendarDays, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Client } from '@/shared/types';
import type { Project } from '@/shared/types';
import { openClientReportPdf } from '@/lib/client-report-pdf';

type ClientReportsCardProps = {
  clients: Client[];
  projects: Project[];
};

export function ClientReportsCard({ clients, projects }: ClientReportsCardProps) {
  const navigate = useNavigate();
  const now = new Date();

  const rows = clients.map((c) => {
    const linked = projects.filter((p) => p.clientId === c.id);
    const overdue = linked.filter((p) => p.dueAt && parseISO(p.dueAt) < now);
    const soon = linked.filter((p) => {
      if (!p.dueAt) return false;
      const days = differenceInCalendarDays(parseISO(p.dueAt), now);
      return days >= 0 && days <= 7;
    });
    return { client: c, linked, overdue, soon };
  }).filter((r) => r.linked.length > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Отчёты по клиентам</CardTitle>
        <CardDescription>Проекты, дедлайны и риски по каждому клиенту.</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Привяжите проекты к клиентам для отчётов.</p>
        ) : (
          <div className="space-y-3">
            {rows.map(({ client, linked, overdue, soon }) => (
              <div
                key={client.id}
                className="flex w-full items-start justify-between gap-3 rounded-md border border-border/60 px-3 py-2"
              >
                <button
                  type="button"
                  onClick={() => navigate(`/clients/${client.id}`)}
                  className="min-w-0 flex-1 text-left hover:opacity-80"
                >
                  <p className="text-sm font-medium">{client.name}</p>
                  <p className="text-xs text-muted-foreground">{linked.length} проект(ов)</p>
                </button>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <div className="flex flex-wrap gap-1">
                    {overdue.length > 0 && (
                      <Badge variant="destructive" className="text-[10px]">
                        {overdue.length} просроч.
                      </Badge>
                    )}
                    {soon.length > 0 && (
                      <Badge variant="secondary" className="text-[10px]">
                        {soon.length} скоро
                      </Badge>
                    )}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 text-xs"
                    onClick={() => openClientReportPdf(client, projects)}
                  >
                    PDF
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
