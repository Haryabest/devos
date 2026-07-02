import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import * as Icons from '@/components/ui/icons';
import { SettingToggle } from '@/features/settings/components/setting-toggle';

type AiContextSectionProps = {
  aiUseDocs: boolean;
  aiUseTasks: boolean;
  aiUseGit: boolean;
  aiUseFigma: boolean;
  apiKeyDraft: string;
  onToggle: (key: 'aiUseDocs' | 'aiUseTasks' | 'aiUseGit' | 'aiUseFigma', value: boolean) => void;
  onApiKeyDraftChange: (value: string) => void;
  onSaveApiKey: () => void;
};

export function AiContextSection({
  aiUseDocs,
  aiUseTasks,
  aiUseGit,
  aiUseFigma,
  apiKeyDraft,
  onToggle,
  onApiKeyDraftChange,
  onSaveApiKey,
}: AiContextSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icons.Sparkles className="h-4 w-4" />
          AI и контекст
        </CardTitle>
        <CardDescription>
          Что AI использует для понимания проекта. Без контекста — «нет данных».
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SettingToggle
          label="Документация"
          description="Страницы docs проекта в RAG"
          checked={aiUseDocs}
          onChange={(v) => onToggle('aiUseDocs', v)}
        />
        <SettingToggle
          label="Задачи"
          description="Kanban, описания, подзадачи"
          checked={aiUseTasks}
          onChange={(v) => onToggle('aiUseTasks', v)}
        />
        <SettingToggle
          label="Git"
          description="Коммиты и репозиторий (при подключении)"
          checked={aiUseGit}
          onChange={(v) => onToggle('aiUseGit', v)}
        />
        <SettingToggle
          label="Figma"
          description="Макеты и прототипы проекта"
          checked={aiUseFigma}
          onChange={(v) => onToggle('aiUseFigma', v)}
        />
        <div className="space-y-2 border-t border-border/40 pt-4">
          <Label htmlFor="openai-key">OpenAI API Key</Label>
          <div className="flex gap-2">
            <Input
              id="openai-key"
              type="password"
              value={apiKeyDraft}
              onChange={(e) => onApiKeyDraftChange(e.target.value)}
              placeholder="sk-… (локально, до backend)"
            />
            <Button variant="outline" onClick={onSaveApiKey}>
              Сохранить
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Ключ хранится локально. После подключения backend — через JWT и сервер.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
