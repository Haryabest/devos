import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BUILTIN_TEMPLATES,
  useProjectTemplatesStore,
} from '@/stores/project-templates-store';

interface ProjectFromTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (projectId: string) => void;
}

export function ProjectFromTemplateDialog({
  open,
  onOpenChange,
  onCreated,
}: ProjectFromTemplateDialogProps) {
  const instantiate = useProjectTemplatesStore((s) => s.instantiate);
  const custom = useProjectTemplatesStore((s) => s.custom);
  const templates = useMemo(() => [...BUILTIN_TEMPLATES, ...custom], [custom]);

  const [templateId, setTemplateId] = useState(BUILTIN_TEMPLATES[0]?.id ?? '');
  const [name, setName] = useState('');

  const selected = templates.find((t) => t.id === templateId);

  function handleCreate() {
    const id = instantiate(templateId, name || selected?.name || 'Новый проект');
    if (!id) return;
    onCreated(id);
    onOpenChange(false);
    setName('');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Создать из шаблона</DialogTitle>
          <DialogDescription>
            Готовые наборы задач и документов для SaaS, лендинга или mobile.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Select value={templateId} onValueChange={setTemplateId}>
            <SelectTrigger>
              <SelectValue placeholder="Шаблон" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selected && (
            <p className="text-sm text-muted-foreground">{selected.description}</p>
          )}
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название проекта"
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button type="button" onClick={handleCreate} disabled={!templateId}>
            Создать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
