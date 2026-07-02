import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useClientsStore } from '@/stores/clients-store';
import { formatPhoneRu } from '@/lib/phone-mask';
import type { Client } from '@/shared/types';

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onCreated?: (id: string) => void;
}

export function ClientFormDialog({
  open,
  onOpenChange,
  client,
  onCreated,
}: ClientFormDialogProps) {
  const add = useClientsStore((s) => s.add);
  const update = useClientsStore((s) => s.update);
  const isEdit = !!client;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(client?.name ?? '');
    setDescription(client?.description ?? '');
    setEmail(client?.email ?? '');
    setPhone(client?.phone ?? '');
  }, [open, client]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (isEdit && client) {
      update(client.id, { name, description, email, phone });
    } else {
      const created = add({ name, description, email, phone });
      onCreated?.(created.id);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Редактировать клиента' : 'Новый клиент'}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? 'Основные данные клиента. Контакты, договоры и файлы — на карточке клиента.'
                : 'Клиент будет сохранён локально.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="client-name">Название</Label>
            <Input
              id="client-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ООО «Пример»"
              autoFocus
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-description">Описание</Label>
            <Input
              id="client-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Кратко о клиенте"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-email">Email</Label>
            <Input
              id="client-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="info@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-phone">Телефон</Label>
            <Input
              id="client-phone"
              value={phone}
              onChange={(e) => setPhone(formatPhoneRu(e.target.value))}
              placeholder="+7 (999) 000-00-00"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {isEdit ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
