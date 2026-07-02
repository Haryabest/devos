import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import * as Icons from '@/components/ui/icons';
import { useProjectsStore } from '@/stores/projects-store';
import { useTasksStore } from '@/stores/tasks-store';
import { useClientsStore } from '@/stores/clients-store';
import { useDocsStore } from '@/stores/docs-store';

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const navigate = useNavigate();
  const projects = useProjectsStore((s) => s.projects);
  const tasks = useTasksStore((s) => s.tasks);
  const clients = useClientsStore((s) => s.clients);
  const docs = useDocsStore((s) => s.docs);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const q = query.trim().toLowerCase();

  const projectItems = useMemo(
    () =>
      projects.filter(
        (p) =>
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      ),
    [projects, q],
  );

  const taskItems = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.parentId === null &&
          (!q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)),
      ),
    [tasks, q],
  );

  const clientItems = useMemo(
    () =>
      clients.filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q),
      ),
    [clients, q],
  );

  const docItems = useMemo(
    () =>
      docs.filter(
        (d) => !q || d.title.toLowerCase().includes(q) || d.content.toLowerCase().includes(q),
      ),
    [docs, q],
  );

  function go(path: string) {
    onOpenChange(false);
    navigate(path);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 shadow-lg sm:max-w-xl">
        <Command shouldFilter={false} className="[&_[cmdk-group-heading]]:text-muted-foreground">
          <CommandInput
            placeholder="Поиск по проектам, задачам, клиентам, документам…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>Ничего не найдено.</CommandEmpty>

            {projectItems.length > 0 && (
              <CommandGroup heading="Проекты">
                {projectItems.slice(0, 8).map((p) => (
                  <CommandItem key={p.id} value={`project-${p.id}`} onSelect={() => go(`/projects/${p.id}`)}>
                    <Icons.Boxes className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{p.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {taskItems.length > 0 && (
              <CommandGroup heading="Задачи">
                {taskItems.slice(0, 8).map((t) => {
                  const p = projects.find((pr) => pr.id === t.projectId);
                  return (
                    <CommandItem
                      key={t.id}
                      value={`task-${t.id}`}
                      onSelect={() => go(`/projects/${t.projectId}/tasks/${t.id}`)}
                    >
                      <Icons.Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{t.title || 'Без названия'}</span>
                      {p && <span className="ml-auto truncate text-xs text-muted-foreground">{p.name}</span>}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {clientItems.length > 0 && (
              <CommandGroup heading="Клиенты">
                {clientItems.slice(0, 6).map((c) => (
                  <CommandItem key={c.id} value={`client-${c.id}`} onSelect={() => go(`/clients/${c.id}`)}>
                    <Icons.Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{c.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {docItems.length > 0 && (
              <CommandGroup heading="Документация">
                {docItems.slice(0, 6).map((d) => (
                  <CommandItem
                    key={d.id}
                    value={`doc-${d.id}`}
                    onSelect={() => go(`/projects/${d.projectId}/docs`)}
                  >
                    <Icons.FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{d.title || 'Без названия'}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

export function useGlobalSearchHotkey(onOpen: () => void) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpen();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onOpen]);
}
