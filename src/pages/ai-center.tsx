import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PageContainer } from '@/components/layout/page-container';
import { MarkdownView } from '@/components/ai/markdown-view';
import * as Icons from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useAiConversations, useAskAi } from '@/hooks/use-ai';
import type { AiConversation, AiMessage } from '@/lib/ai-api';

function MessageBubble({ message }: { message: AiMessage }) {
  const isUser = message.role === 'USER';
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-lg px-3 py-2 text-sm',
          isUser ? 'bg-primary text-primary-foreground' : 'border border-border/60 bg-card',
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <MarkdownView content={message.content} />
        )}
      </div>
    </div>
  );
}

export function AiCenterPage() {
  const workspaceId = useAuthStore((s) => s.workspaceId);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [localMessages, setLocalMessages] = useState<AiMessage[]>([]);
  const messagesRef = useRef<HTMLDivElement>(null);

  const conversationsQuery = useAiConversations(workspaceId);
  const ask = useAskAi();

  const conversations = conversationsQuery.data ?? [];

  const activeConversation = useMemo(() => {
    if (!activeId) return null;
    return conversations.find((c) => c.id === activeId) ?? null;
  }, [activeId, conversations]);

  useEffect(() => {
    if (!activeId && conversations[0]) {
      setActiveId(conversations[0].id);
    }
  }, [activeId, conversations]);

  useEffect(() => {
    if (activeConversation) {
      setLocalMessages(activeConversation.messages);
    } else if (!activeId) {
      setLocalMessages([]);
    }
  }, [activeId, activeConversation?.id, activeConversation?.messages.length]);

  useEffect(() => {
    const el = messagesRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [localMessages, ask.isPending]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!workspaceId || !input.trim()) return;

    const question = input.trim();
    const optimistic: AiMessage = {
      id: `tmp-${Date.now()}`,
      role: 'USER',
      content: question,
      createdAt: new Date().toISOString(),
    };
    setLocalMessages((prev) => [...prev, optimistic]);
    setInput('');

    try {
      const res = await ask.mutateAsync({
        workspaceId,
        question,
        conversationId: activeId ?? undefined,
        context: 'general',
      });
      if (!activeId) setActiveId(res.conversationId);
      setLocalMessages((prev) => [...prev, res.message]);
    } catch (err) {
      setLocalMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'ASSISTANT',
          content: err instanceof Error ? err.message : 'Ошибка AI',
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  }

  function startNewChat() {
    setActiveId(null);
    setLocalMessages([]);
    setInput('');
  }

  if (!workspaceId) {
    return (
      <PageContainer>
        <p className="text-sm text-muted-foreground">Загрузка воркспейса…</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="flex h-full max-w-none flex-col gap-0 overflow-hidden p-0">
      <header className="shrink-0 border-b border-border/60 px-6 py-4">
        <div className="flex items-center gap-2">
          <Icons.Sparkles className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">AI Центр</h1>
            <p className="text-sm text-muted-foreground">
              Чат с контекстом воркспейса, история диалогов, генерация и аналитика.
            </p>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-64 shrink-0 flex-col border-r border-border/60 bg-card/30">
          <div className="shrink-0 border-b border-border/60 p-3">
            <Button type="button" size="sm" variant="outline" className="w-full gap-1.5" onClick={startNewChat}>
              <Icons.Plus className="h-4 w-4" />
              Новый диалог
            </Button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="space-y-0.5 p-2">
              {conversationsQuery.isLoading && (
                <p className="px-2 py-3 text-xs text-muted-foreground">Загрузка…</p>
              )}
              {conversations.map((conv: AiConversation) => (
                <button
                  key={conv.id}
                  type="button"
                  className={cn(
                    'w-full rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent',
                    activeId === conv.id && 'bg-accent text-accent-foreground',
                  )}
                  onClick={() => setActiveId(conv.id)}
                >
                  <p className="truncate font-medium">{conv.title || 'Без названия'}</p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {new Date(conv.updatedAt).toLocaleString('ru-RU')}
                  </p>
                </button>
              ))}
              {!conversationsQuery.isLoading && conversations.length === 0 && (
                <p className="px-2 py-3 text-xs text-muted-foreground">Диалогов пока нет</p>
              )}
            </div>
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col p-4">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/60 bg-card/20 shadow-sm">
            <div ref={messagesRef} className="min-h-0 flex-1 overflow-y-auto">
              <div className="mx-auto max-w-3xl space-y-4 p-6">
                {localMessages.length === 0 && !ask.isPending && (
                  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
                    <Icons.Sparkles className="h-10 w-10 opacity-40" />
                    <p className="text-sm">Спросите AI о проектах, задачах или документации воркспейса.</p>
                  </div>
                )}
                {localMessages.map((m) => (
                  <MessageBubble key={m.id} message={m} />
                ))}
                {ask.isPending && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icons.Loader2 className="h-4 w-4 animate-spin" />
                    AI думает…
                  </div>
                )}
              </div>
            </div>

            <form
              onSubmit={handleSend}
              className="shrink-0 border-t border-border/60 bg-background/80 p-4 backdrop-blur-sm"
            >
              <div className="mx-auto flex max-w-3xl flex-col gap-3">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Задайте вопрос AI…"
                  rows={4}
                  className="min-h-[120px] resize-none text-sm"
                  disabled={ask.isPending}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void handleSend(e);
                    }
                  }}
                />
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">Enter — отправить, Shift+Enter — новая строка</p>
                  <Button type="submit" className="gap-1.5" disabled={ask.isPending || !input.trim()}>
                    {ask.isPending ? (
                      <Icons.Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Icons.Send className="h-4 w-4" />
                    )}
                    Отправить
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
