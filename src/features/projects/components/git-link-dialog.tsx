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
import * as Icons from '@/components/ui/icons';

interface GitLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onSave: (url: string) => void;
}

export function GitLinkDialog({ open, onOpenChange, value, onSave }: GitLinkDialogProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSave(draft.trim());
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icons.Github className="h-4 w-4" />
              GitHub-репозиторий
            </DialogTitle>
            <DialogDescription>
              Публичный репозиторий GitHub — для статистики коммитов и строк кода.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="git-url">Ссылка</Label>
            <Input
              id="git-url"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="https://github.com/org/repo"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit">Сохранить</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
