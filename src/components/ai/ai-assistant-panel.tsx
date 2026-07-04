import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import * as Icons from '@/components/ui/icons';
import { MarkdownView } from '@/components/ai/markdown-view';
import { cn } from '@/lib/utils';
import {
  useAnalyzeProject,
  useAskAi,
  useDocumentAssist,
  useGenerateTasks,
  useRoadmapSuggest,
  useWhiteboardSuggest,
} from '@/hooks/use-ai';
import type { AiContextKind } from '@/lib/ai-api';
import { fetchWorkspaceTasks } from '@/lib/server-persist';
import { useRoadmapStore } from '@/stores/roadmap-store';
import { useTasksStore } from '@/stores/tasks/tasks-store';
import { useQueryClient } from '@tanstack/react-query';

type AiAssistantExtra = {
  documentContent?: string;
  documentId?: string;
  taskId?: string;
  boardContent?: unknown;
  onDocumentApply?: (content: string) => void;
};

type AiAssistantPanelProps = {
  context: AiContextKind;
  workspaceId: string;
  projectId?: string;
  documentId?: string;
  taskId?: string;
  extra?: AiAssistantExtra;
  compact?: boolean;
  className?: string;
};

type ActionDef = {
  id: string;
  label: string;
  prompt?: string;
  mode: 'ask' | 'document' | 'tasks' | 'roadmap' | 'whiteboard' | 'analyze' | 'health';
};

const CONTEXT_ACTIONS: Record<AiContextKind, ActionDef[]> = {
  general: [],
  document: [
    { id: 'improve', label: 'Улучшить текст', prompt: 'Улучши стиль и структуру текста', mode: 'document' },
    { id: 'shorten', label: 'Сократить', prompt: 'Сократи текст, сохранив смысл', mode: 'document' },
    { id: 'summarize', label: 'Краткое резюме', prompt: 'Сделай краткое резюме', mode: 'document' },
  ],
  task: [
    { id: 'gen-tasks', label: 'Сгенерировать задачи', prompt: 'Сгенерируй задачи по контексту проекта', mode: 'tasks' },
  ],
  roadmap: [
    { id: 'suggest-cards', label: 'Предложить карточки', prompt: 'Предложи карточки для roadmap', mode: 'roadmap' },
  ],
  whiteboard: [
    { id: 'suggest-elements', label: 'Предложить элементы', prompt: 'Предложи элементы для доски', mode: 'whiteboard' },
  ],
  project: [
    { id: 'analyze', label: 'Анализ проекта', mode: 'analyze' },
    { id: 'health', label: 'Health Score', mode: 'health' },
  ],
};

export function AiAssistantPanel({
  context,
  workspaceId,
  projectId,
  documentId,
  taskId,
  extra,
  compact = false,
  className,
}: AiAssistantPanelProps) {
  const [open, setOpen] = useState(!compact);
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  const ask = useAskAi();
  const genTasks = useGenerateTasks();
  const docAssist = useDocumentAssist();
  const roadmap = useRoadmapSuggest();
  const whiteboard = useWhiteboardSuggest();
  const analyze = useAnalyzeProject();
  const qc = useQueryClient();

  const addCard = useRoadmapStore((s) => s.addCard);
  const columns = useRoadmapStore((s) => s.columns);
  const setTasksFromServer = useTasksStore((s) => s.setFromServer);

  const actions = CONTEXT_ACTIONS[context];
  const loading =
    ask.isPending ||
    genTasks.isPending ||
    docAssist.isPending ||
    roadmap.isPending ||
    whiteboard.isPending ||
    analyze.isPending;

  const title = useMemo(() => {
    const map: Record<AiContextKind, string> = {
      general: 'AI-ассистент',
      document: 'AI для документа',
      task: 'AI для задач',
      roadmap: 'AI для roadmap',
      whiteboard: 'AI для доски',
      project: 'AI-аналитик',
    };
    return map[context];
  }, [context]);

  async function runAction(action: ActionDef, question?: string) {
    setError(null);
    const prompt = question?.trim() || action.prompt || input.trim();
    if (!prompt && action.mode !== 'analyze' && action.mode !== 'health') return;

    try {
      if (action.mode === 'ask') {
        const res = await ask.mutateAsync({
          workspaceId,
          projectId,
          question: prompt,
          conversationId,
          context,
        });
        setConversationId(res.conversationId);
        setResponse(res.message.content);
        return;
      }

      if (action.mode === 'document') {
        const content = extra?.documentContent ?? '';
        if (!content.trim()) {
          setError('Нет текста документа для обработки');
          return;
        }
        const res = await docAssist.mutateAsync({
          workspaceId,
          projectId,
          documentId: documentId ?? extra?.documentId,
          instruction: prompt,
          content,
        });
        setResponse(res.content);
        return;
      }

      if (action.mode === 'tasks') {
        if (!projectId) {
          setError('Не указан проект');
          return;
        }
        const res = await genTasks.mutateAsync({
          workspaceId,
          projectId,
          prompt,
          documentId: documentId ?? extra?.documentId,
        });
        setResponse(
          `Создано задач: **${res.created}**\n\n` +
            res.tasks.map((t) => `- **${t.title}** (${t.priority})${t.description ? `: ${t.description}` : ''}`).join('\n'),
        );
        if (projectId) {
          const apiTasks = await fetchWorkspaceTasks([projectId]);
          setTasksFromServer([projectId], apiTasks);
        }
        return;
      }

      if (action.mode === 'roadmap') {
        if (!projectId) {
          setError('Не указан проект');
          return;
        }
        const res = await roadmap.mutateAsync({ workspaceId, projectId, prompt });
        const projectCols = columns.filter((c) => c.projectId === projectId);
        const colByKey = (key: string) =>
          projectCols.find((c) => c.name.toLowerCase().includes(key))?.id ?? projectCols[0]?.id;

        for (const card of res.cards) {
          const columnId = colByKey(card.column) ?? projectCols[0]?.id;
          if (columnId) {
            addCard({ projectId, columnId, title: card.title, description: card.description });
          }
        }

        setResponse(
          `Предложено карточек: **${res.cards.length}**\n\n` +
            res.cards.map((c) => `- **${c.title}** (${c.column}): ${c.description}`).join('\n'),
        );
        return;
      }

      if (action.mode === 'whiteboard') {
        if (!projectId) {
          setError('Не указан проект');
          return;
        }
        const res = await whiteboard.mutateAsync({
          workspaceId,
          projectId,
          prompt,
          boardContent: extra?.boardContent,
        });
        if (res.raw && !res.elements.length) {
          setResponse(res.raw);
        } else {
          setResponse(
            `Элементов: **${res.elements.length}**\n\n` +
              res.elements.map((el) => `- ${el.type}: **${el.label}** (${el.x}, ${el.y})`).join('\n'),
          );
        }
        return;
      }

      if (action.mode === 'analyze') {
        if (!projectId) {
          setError('Не указан проект');
          return;
        }
        const res = await analyze.mutateAsync({ workspaceId, projectId });
        setResponse(
          `${res.summary}\n\n**Риски:**\n${res.risks.map((r) => `- ${r}`).join('\n') || '- нет'}\n\n**Рекомендации:**\n${res.recommendations.map((r) => `- ${r}`).join('\n') || '- нет'}`,
        );
        return;
      }

      if (action.mode === 'health') {
        if (!projectId) {
          setError('Не указан проект');
          return;
        }
        const res = await qc.fetchQuery({
          queryKey: ['ai', 'health-score', projectId],
          queryFn: () => import('@/lib/ai-api').then((m) => m.fetchHealthScore(projectId)),
        });
        setResponse(
          `**Health Score: ${res.score}/100**\n\n${res.summary}\n\n**Риски:**\n${res.risks.map((r) => `- ${r}`).join('\n') || '- нет'}\n\n**Рекомендации:**\n${res.recommendations.map((r) => `- ${r}`).join('\n') || '- нет'}`,
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка AI');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    await runAction({ id: 'custom', label: 'Спросить', mode: 'ask' }, input);
    setInput('');
  }

  return (
    <div
      className={cn(
        'border-border/60 bg-card/80',
        compact ? 'rounded-md border' : 'rounded-lg border shadow-sm',
        className,
      )}
    >
      <button
        type="button"
        className={cn(
          'flex w-full items-center gap-2 px-3 text-left transition-colors hover:bg-accent/50',
          compact ? 'py-1.5' : 'py-2.5',
        )}
        onClick={() => setOpen((v) => !v)}
      >
        <Icons.Sparkles className="h-4 w-4 shrink-0 text-primary" />
        <span className={cn('font-medium', compact ? 'text-xs' : 'text-sm')}>{title}</span>
        <span className="ml-auto text-muted-foreground">
          {open ? <Icons.ChevronUp className="h-4 w-4" /> : <Icons.ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      {open && (
        <div className={cn('border-t border-border/60', compact ? 'p-2' : 'p-3')}>
          {actions.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {actions.map((action) => (
                <Button
                  key={action.id}
                  type="button"
                  size="sm"
                  variant="outline"
                  className={cn(compact && 'h-7 text-xs')}
                  disabled={loading}
                  onClick={() => runAction(action)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                context === 'document'
                  ? 'Инструкция для AI или вопрос…'
                  : 'Спросите AI…'
              }
              rows={compact ? 2 : 3}
              className={cn('resize-none', compact && 'text-xs')}
              disabled={loading}
            />
            <div className="flex items-center gap-2">
              <Button type="submit" size="sm" disabled={loading || !input.trim()} className="gap-1.5">
                {loading ? (
                  <Icons.Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Icons.Send className="h-3.5 w-3.5" />
                )}
                Отправить
              </Button>
              {(documentId || taskId) && (
                <span className="text-[10px] text-muted-foreground">
                  {documentId ? `doc:${documentId.slice(0, 8)}` : null}
                  {taskId ? `task:${taskId.slice(0, 8)}` : null}
                </span>
              )}
            </div>
          </form>

          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

          {response && (
            <ScrollArea className={cn('mt-3 rounded-md border border-border/60 bg-background/60', compact ? 'max-h-40' : 'max-h-64')}>
              <div className="p-3">
                <MarkdownView content={response} />
                {context === 'document' && extra?.onDocumentApply && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="mt-2"
                    onClick={() => extra.onDocumentApply?.(response)}
                  >
                    Применить к документу
                  </Button>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  );
}
