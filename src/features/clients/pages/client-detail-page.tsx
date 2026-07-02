import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { ClientFilesList } from '@/features/clients/components/client-files-list';
import { AddAttachment } from '@/components/ui/attachments';
import { DatePicker } from '@/components/ui/date-picker';
import * as Icons from '@/components/ui/icons';
import { useClientsStore } from '@/stores/clients-store';
import { useProjectsStore } from '@/stores/projects-store';
import { useGroupsStore } from '@/stores/groups-store';
import { useTasksStore } from '@/stores/tasks-store';
import { useDocsStore } from '@/stores/docs-store';
import { useApiStore } from '@/stores/api-store';
import { ProjectGrid } from '@/features/projects/components/project-grid';
import { ClientFormDialog } from '@/features/clients/components/client-form-dialog';
import { AttachProjectsDialog } from '@/features/clients/components/attach-projects-dialog';
import { PageContainer } from '@/components/layout/page-container';
import { BreadcrumbBack } from '@/components/layout/breadcrumb-back';
import { formatDateTime } from '@/lib/format-date';

export function ClientDetailPage() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const client = useClientsStore((s) => s.clients.find((c) => c.id === clientId));
  const update = useClientsStore((s) => s.update);
  const remove = useClientsStore((s) => s.remove);
  const addContact = useClientsStore((s) => s.addContact);
  const removeContact = useClientsStore((s) => s.removeContact);
  const addContract = useClientsStore((s) => s.addContract);
  const removeContract = useClientsStore((s) => s.removeContract);
  const addFile = useClientsStore((s) => s.addFile);
  const removeFile = useClientsStore((s) => s.removeFile);

  const projects = useProjectsStore((s) => s.projects);
  const updateProject = useProjectsStore((s) => s.update);
  const groups = useGroupsStore((s) => s.groups);
  const tasks = useTasksStore((s) => s.tasks);
  const docs = useDocsStore((s) => s.docs);
  const endpoints = useApiStore((s) => s.endpoints);

  const [editOpen, setEditOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');

  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const [contractTitle, setContractTitle] = useState('');
  const [contractNumber, setContractNumber] = useState('');
  const [contractDate, setContractDate] = useState<string | null>(null);
  const [contractNotes, setContractNotes] = useState('');

  const linkedProjects = useMemo(
    () => projects.filter((p) => p.clientId === clientId),
    [projects, clientId],
  );

  useEffect(() => {
    if (client) setNotesDraft(client.notes);
  }, [client?.id, client?.notes]);

  if (!client) {
    return (
      <PageContainer>
        <Card>
          <CardHeader>
            <CardTitle>Клиент не найден</CardTitle>
            <CardDescription>Возможно, карточка была удалена или ссылка устарела.</CardDescription>
          </CardHeader>
          <CardContent>
            <BreadcrumbBack label="Клиенты" to="/clients" />
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  function saveNotes() {
    update(client!.id, { notes: notesDraft });
  }

  function submitContact(e: React.FormEvent) {
    e.preventDefault();
    if (!contactName.trim()) return;
    addContact(client!.id, {
      name: contactName,
      role: contactRole,
      email: contactEmail,
      phone: contactPhone,
    });
    setContactName('');
    setContactRole('');
    setContactEmail('');
    setContactPhone('');
  }

  function submitContract(e: React.FormEvent) {
    e.preventDefault();
    if (!contractTitle.trim()) return;
    addContract(client!.id, {
      title: contractTitle,
      number: contractNumber,
      date: contractDate ?? '',
      notes: contractNotes,
    });
    setContractTitle('');
    setContractNumber('');
    setContractDate('');
    setContractNotes('');
  }

  return (
    <PageContainer>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <BreadcrumbBack label="Клиенты" to="/clients" className="mb-1" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{client.name}</h1>
            {client.description && (
              <p className="mt-1 text-sm text-muted-foreground">{client.description}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            {client.email && (
              <a href={`mailto:${client.email}`} className="flex items-center gap-1.5 hover:text-foreground">
                <Icons.Mail className="h-3.5 w-3.5" />
                {client.email}
              </a>
            )}
            {client.phone && (
              <a href={`tel:${client.phone}`} className="flex items-center gap-1.5 hover:text-foreground">
                <Icons.Phone className="h-3.5 w-3.5" />
                {client.phone}
              </a>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditOpen(true)}>
            <Icons.Pencil className="h-3.5 w-3.5" />
            Редактировать
          </Button>
          <Button variant="outline" size="sm" className="gap-2 text-destructive" onClick={() => setDeleteOpen(true)}>
            <Icons.Trash2 className="h-3.5 w-3.5" />
            Удалить
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Сводка по клиенту</CardTitle>
          <CardDescription>Подробная информация — всё сохраняется в аккаунте</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            <div>
              <dt className="text-xs text-muted-foreground">Email</dt>
              <dd className="mt-1 text-sm">{client.email || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Телефон</dt>
              <dd className="mt-1 text-sm">{client.phone || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Проектов</dt>
              <dd className="mt-1 text-sm">{linkedProjects.length}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Контактов</dt>
              <dd className="mt-1 text-sm">{client.contacts.length}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Договоров</dt>
              <dd className="mt-1 text-sm">{client.contracts.length}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Файлов</dt>
              <dd className="mt-1 text-sm">{client.files.length}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted-foreground">Описание</dt>
              <dd className="mt-1 text-sm">{client.description || '—'}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted-foreground">Заметки</dt>
              <dd className="mt-1 text-sm line-clamp-3">{client.notes || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Создан</dt>
              <dd className="mt-1 text-sm">{formatDateTime(client.createdAt)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects" className="gap-1.5">
            <Icons.Boxes className="h-3.5 w-3.5" />
            Проекты
            {linkedProjects.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                {linkedProjects.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="contacts" className="gap-1.5">
            <Icons.User className="h-3.5 w-3.5" />
            Контакты
          </TabsTrigger>
          <TabsTrigger value="contracts" className="gap-1.5">
            <Icons.FileText className="h-3.5 w-3.5" />
            Договоры
          </TabsTrigger>
          <TabsTrigger value="files" className="gap-1.5">
            <Icons.Paperclip className="h-3.5 w-3.5" />
            Файлы
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-1.5">
            <Icons.Pencil className="h-3.5 w-3.5" />
            Заметки
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div>
                <CardTitle className="text-base">Проекты клиента</CardTitle>
                <CardDescription>Привяжите существующие проекты из воркспейса.</CardDescription>
              </div>
              <Button size="sm" className="gap-2 shrink-0" onClick={() => setAttachOpen(true)}>
                <Icons.Plus className="h-3.5 w-3.5" />
                Привязать
              </Button>
            </CardHeader>
            <CardContent>
              {linkedProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Пока нет привязанных проектов. Нажмите «Привязать», чтобы выбрать из списка.
                </p>
              ) : (
                <ProjectGrid
                  projects={linkedProjects}
                  tasks={tasks}
                  docs={docs}
                  endpoints={endpoints}
                  groups={groups}
                  onOpen={(id) => navigate(`/projects/${id}`)}
                  onDelete={(p) => updateProject(p.id, { clientId: null })}
                  deleteAction="detach"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Контакты</CardTitle>
              <CardDescription>Лица для связи по этому клиенту.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {client.contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Контактов пока нет.</p>
              ) : (
                <div className="space-y-2">
                  {client.contacts.map((c) => (
                    <div
                      key={c.id}
                      className="group flex items-start justify-between gap-3 rounded-md border border-border/60 px-3 py-2.5"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-sm font-medium">{c.name}</p>
                        {c.role && <p className="text-xs text-muted-foreground">{c.role}</p>}
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {c.email && <span>{c.email}</span>}
                          {c.phone && <span>{c.phone}</span>}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100"
                        onClick={() => removeContact(client.id, c.id)}
                      >
                        <Icons.Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <form onSubmit={submitContact} className="space-y-3 rounded-md border border-border/60 p-3">
                <p className="text-xs font-medium text-muted-foreground">Добавить контакт</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="contact-name" className="text-xs">Имя</Label>
                    <Input id="contact-name" value={contactName} onChange={(e) => setContactName(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="contact-role" className="text-xs">Должность</Label>
                    <Input id="contact-role" value={contactRole} onChange={(e) => setContactRole(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="contact-email" className="text-xs">Email</Label>
                    <Input id="contact-email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="contact-phone" className="text-xs">Телефон</Label>
                    <Input id="contact-phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                  </div>
                </div>
                <Button type="submit" size="sm" disabled={!contactName.trim()}>
                  Добавить
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Договоры</CardTitle>
              <CardDescription>Договоры и соглашения с клиентом.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {client.contracts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Договоров пока нет.</p>
              ) : (
                <div className="space-y-2">
                  {client.contracts.map((c) => (
                    <div
                      key={c.id}
                      className="group flex items-start justify-between gap-3 rounded-md border border-border/60 px-3 py-2.5"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-sm font-medium">{c.title}</p>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {c.number && <span>№ {c.number}</span>}
                          {c.date && <span>{c.date}</span>}
                        </div>
                        {c.notes && <p className="text-xs text-muted-foreground">{c.notes}</p>}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100"
                        onClick={() => removeContract(client.id, c.id)}
                      >
                        <Icons.Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <form onSubmit={submitContract} className="space-y-3 rounded-md border border-border/60 p-3">
                <p className="text-xs font-medium text-muted-foreground">Добавить договор</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="contract-title" className="text-xs">Название</Label>
                    <Input id="contract-title" value={contractTitle} onChange={(e) => setContractTitle(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="contract-number" className="text-xs">Номер</Label>
                    <Input id="contract-number" value={contractNumber} onChange={(e) => setContractNumber(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="contract-date" className="text-xs">Дата</Label>
                    <DatePicker
                      value={contractDate}
                      onChange={setContractDate}
                      placeholder="Дата договора"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="contract-notes" className="text-xs">Примечание</Label>
                    <Input id="contract-notes" value={contractNotes} onChange={(e) => setContractNotes(e.target.value)} />
                  </div>
                </div>
                <Button type="submit" size="sm" disabled={!contractTitle.trim()}>
                  Добавить
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Файлы</CardTitle>
              <CardDescription>Ссылки, документы и вложения клиента.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ClientFilesList
                files={client.files}
                onRemove={(id) => removeFile(client.id, id)}
                emptyText="Нет файлов. Добавьте ссылку или загрузите документ."
              />
              <AddAttachment onAdd={(a) => addFile(client.id, a)} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Заметки</CardTitle>
              <CardDescription>Произвольные заметки по клиенту.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="Заметки о клиенте…"
                className="min-h-40 w-full resize-y rounded-md border border-input bg-transparent p-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <Button
                size="sm"
                onClick={saveNotes}
                disabled={notesDraft === client.notes}
              >
                Сохранить
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ClientFormDialog open={editOpen} onOpenChange={setEditOpen} client={client} />
      <AttachProjectsDialog
        open={attachOpen}
        onOpenChange={setAttachOpen}
        clientId={client.id}
        clientName={client.name}
      />
      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Удалить клиента?"
        description={`«${client.name}» будет удалён. Проекты останутся, но отвяжутся от клиента.`}
        onConfirm={() => {
          remove(client.id);
          navigate('/clients');
        }}
      />
    </PageContainer>
  );
}
