import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuditStore } from '@/stores/audit-store';

export function AuditLogCard() {
  const navigate = useNavigate();
  const entries = useAuditStore((s) => s.recent(10));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Журнал активности</CardTitle>
        <CardDescription>Audit log — действия в воркспейсе.</CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">События появятся по мере работы.</p>
        ) : (
          <ul className="space-y-2">
            {entries.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  className="flex w-full flex-col rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                  onClick={() => e.projectId && navigate(`/projects/${e.projectId}`)}
                >
                  <span className="font-medium">{e.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {e.action}
                    {e.meta ? ` · ${e.meta}` : ''} · {new Date(e.at).toLocaleString('ru-RU')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
