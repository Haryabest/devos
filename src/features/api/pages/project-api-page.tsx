import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDeleteDialog, type DeleteConfirmState } from '@/components/ui/confirm-delete-dialog';
import * as Icons from '@/components/ui/icons';
import { BreadcrumbBack } from '@/components/layout/breadcrumb-back';
import { PageTopBar } from '@/components/layout/page-top-bar';
import { cn } from '@/lib/utils';
import { useProjectsStore } from '@/stores/projects-store';
import { HTTP_METHODS, METHOD_COLOR, useApiStore } from '@/stores/api-store';
import type { ApiEndpoint } from '@/shared/types';
import { parseHeaders } from '@/features/api/utils/parse-headers';
import { prettyJson } from '@/features/api/utils/pretty-json';

interface ApiResult {
  ok: boolean;
  status: number;
  statusText: string;
  timeMs: number;
  body: string;
  error?: string;
}

export function ProjectApiPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const project = useProjectsStore((s) => s.projects.find((p) => p.id === projectId));
  const endpoints = useApiStore((s) => s.endpoints);
  const add = useApiStore((s) => s.add);
  const update = useApiStore((s) => s.update);
  const remove = useApiStore((s) => s.remove);

  const projectEndpoints = useMemo(
    () => endpoints.filter((e) => e.projectId === projectId),
    [endpoints, projectId],
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const active = projectEndpoints.find((e) => e.id === activeId) ?? projectEndpoints[0] ?? null;

  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(null);

  if (!project) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Проект не найден</CardTitle>
            <CardDescription>Возможно, он был удалён.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" onClick={() => navigate('/projects')} className="gap-2">
              <Icons.ArrowLeft className="h-4 w-4" />
              К проектам
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  function handleAdd() {
    const ep = add({ projectId: project!.id, url: 'https://' });
    setActiveId(ep.id);
    setResult(null);
  }

  async function send(ep: ApiEndpoint) {
    if (!ep.url.trim()) return;
    setLoading(true);
    setResult(null);
    const start = performance.now();
    try {
      const init: RequestInit = { method: ep.method, headers: parseHeaders(ep.headers) };
      if (ep.method !== 'GET' && ep.body.trim()) init.body = ep.body;
      const res = await fetch(ep.url, init);
      const text = await res.text();
      setResult({
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
        timeMs: Math.round(performance.now() - start),
        body: prettyJson(text),
      });
    } catch (e) {
      setResult({
        ok: false,
        status: 0,
        statusText: 'Ошибка сети',
        timeMs: Math.round(performance.now() - start),
        body: '',
        error:
          e instanceof Error ? e.message : 'Не удалось выполнить запрос (возможно, CORS).',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <PageTopBar breadcrumb={<BreadcrumbBack label={project.name} to={`/projects/${project.id}`} />}>
        <h1 className="text-2xl font-semibold tracking-tight">API</h1>
        <p className="text-sm text-muted-foreground">
          Эндпоинты проекта. Добавьте и проверьте запрос прямо здесь.
        </p>
      </PageTopBar>

      <div className="flex flex-1 overflow-hidden">
        <aside className="flex w-64 flex-col border-r border-border/60">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground">Запросы</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleAdd} aria-label="Новый запрос">
              <Icons.Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-auto px-2 pb-2">
            {projectEndpoints.length === 0 ? (
              <p className="px-2 py-4 text-xs text-muted-foreground">Нет запросов.</p>
            ) : (
              projectEndpoints.map((e) => (
                <button
                  key={e.id}
                  onClick={() => {
                    setActiveId(e.id);
                    setResult(null);
                  }}
                  className={cn(
                    'group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent',
                    active?.id === e.id && 'bg-accent',
                  )}
                >
                  <span className={cn('w-10 shrink-0 text-[10px] font-bold', METHOD_COLOR[e.method])}>
                    {e.method}
                  </span>
                  <span className="flex-1 truncate">{e.name}</span>
                  <span
                    role="button"
                    tabIndex={-1}
                    aria-label="Удалить"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setDeleteConfirm({
                        title: 'Удалить эндпоинт?',
                        description: `«${e.name}» будет удалён.`,
                        onConfirm: () => {
                          remove(e.id);
                          if (activeId === e.id) setActiveId(null);
                        },
                      });
                    }}
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Icons.Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </span>
                </button>
              ))
            )}
          </div>
        </aside>

        <div className="flex-1 overflow-auto">
          {active ? (
            <div className="space-y-4 p-6">
              <Input
                value={active.name}
                onChange={(e) => update(active.id, { name: e.target.value })}
                placeholder="Название запроса"
                className="max-w-md border-0 px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
              />

              <div className="flex gap-2">
                <Select
                  value={active.method}
                  onValueChange={(v) => update(active.id, { method: v as ApiEndpoint['method'] })}
                >
                  <SelectTrigger className={cn('w-28 shrink-0 font-bold', METHOD_COLOR[active.method])}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HTTP_METHODS.map((m) => (
                      <SelectItem key={m} value={m} className={cn('font-bold', METHOD_COLOR[m])}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={active.url}
                  onChange={(e) => update(active.id, { url: e.target.value })}
                  placeholder="https://api.example.com/v1/users"
                  className="flex-1 font-mono text-xs"
                />
                <Button onClick={() => send(active)} disabled={loading} className="gap-2">
                  {loading ? (
                    <Icons.Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Icons.Send className="h-4 w-4" />
                  )}
                  Отправить
                </Button>
              </div>

              <Tabs defaultValue="headers">
                <TabsList>
                  <TabsTrigger value="headers">Заголовки</TabsTrigger>
                  <TabsTrigger value="body">Тело</TabsTrigger>
                </TabsList>
                <TabsContent value="headers">
                  <textarea
                    value={active.headers}
                    onChange={(e) => update(active.id, { headers: e.target.value })}
                    placeholder={'Authorization: Bearer …\nContent-Type: application/json'}
                    className="h-28 w-full resize-none rounded-md border border-input bg-transparent p-3 font-mono text-xs shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </TabsContent>
                <TabsContent value="body">
                  <textarea
                    value={active.body}
                    onChange={(e) => update(active.id, { body: e.target.value })}
                    placeholder={active.method === 'GET' ? 'GET-запрос без тела' : '{\n  "key": "value"\n}'}
                    disabled={active.method === 'GET'}
                    className="h-28 w-full resize-none rounded-md border border-input bg-transparent p-3 font-mono text-xs shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                  />
                </TabsContent>
              </Tabs>

              {result && (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <Badge variant={result.ok ? 'default' : 'destructive'}>
                      {result.status || '—'} {result.statusText}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{result.timeMs} мс</span>
                  </div>
                  {result.error ? (
                    <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                      {result.error}
                      <p className="mt-1 text-muted-foreground">
                        Частая причина — CORS. Проверяйте свои эндпоинты или API с открытым CORS.
                      </p>
                    </div>
                  ) : (
                    <pre className="max-h-80 overflow-auto rounded-md border border-border/60 bg-muted/40 p-3 font-mono text-xs">
                      {result.body || '(пустой ответ)'}
                    </pre>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <Icons.Plug className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Добавьте первый эндпоинт.</p>
              <Button variant="outline" size="sm" onClick={handleAdd} className="gap-2">
                <Icons.Plus className="h-4 w-4" />
                Новый запрос
              </Button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDeleteDialog
        open={deleteConfirm !== null}
        onOpenChange={(o) => !o && setDeleteConfirm(null)}
        title={deleteConfirm?.title}
        description={deleteConfirm?.description}
        onConfirm={() => deleteConfirm?.onConfirm()}
      />
    </div>
  );
}
