import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDeleteDialog, type DeleteConfirmState } from '@/components/ui/confirm-delete-dialog';
import * as Icons from '@/components/ui/icons';
import { useClientsStore } from '@/stores/clients-store';
import { useProjectsStore } from '@/stores/projects-store';
import type { Client } from '@/shared/types';
import { ClientGrid } from '@/features/clients/components/client-grid';
import { EmptyClients } from '@/features/clients/components/empty-clients';
import { ClientFormDialog } from '@/features/clients/components/client-form-dialog';

export function ClientsPage() {
  const navigate = useNavigate();
  const clients = useClientsStore((s) => s.clients);
  const removeClient = useClientsStore((s) => s.remove);
  const projects = useProjectsStore((s) => s.projects);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(null);

  const projectCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of projects) {
      if (p.clientId) counts[p.clientId] = (counts[p.clientId] ?? 0) + 1;
    }
    return counts;
  }, [projects]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q),
    );
  }, [clients, search]);

  function handleDelete(client: Client) {
    setDeleteConfirm({
      title: 'Удалить клиента?',
      description: `«${client.name}» будет удалён. Проекты останутся, но отвяжутся от клиента.`,
      onConfirm: () => removeClient(client.id),
    });
  }

  return (
    <div className="w-full space-y-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Клиенты</h1>
          <p className="text-sm text-muted-foreground">
            Карточки заказчиков: контакты, договоры, файлы и привязка проектов.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="shrink-0 gap-2">
          <Icons.Plus className="h-4 w-4" />
          Клиент
        </Button>
      </header>

      {clients.length > 0 && (
        <div className="relative max-w-md">
          <Icons.Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию, email, телефону…"
            className="h-9 pl-8"
          />
        </div>
      )}

      {clients.length === 0 ? (
        <EmptyClients onCreate={() => setOpen(true)} />
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Нет клиентов по запросу «{search.trim()}».
          </CardContent>
        </Card>
      ) : (
        <ClientGrid
          clients={filtered}
          projectCounts={projectCounts}
          onOpen={(id) => navigate(`/clients/${id}`)}
          onDelete={handleDelete}
        />
      )}

      <ClientFormDialog
        open={open}
        onOpenChange={setOpen}
        onCreated={(id) => navigate(`/clients/${id}`)}
      />
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
