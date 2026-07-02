import { useEffect, useState } from 'react';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { useTheme } from '@/lib/use-theme';
import { useSettingsStore, type ThemePreference } from '@/stores/settings-store';
import { useAuthStore } from '@/stores/auth-store';
import { WorkspaceSection } from '@/features/settings/components/workspace-section';
import { AppearanceSection } from '@/features/settings/components/appearance-section';
import { AiContextSection } from '@/features/settings/components/ai-context-section';
import { AutosaveSection } from '@/features/settings/components/autosave-section';
import { IntegrationsSection } from '@/features/settings/components/integrations-section';
import { DataSection } from '@/features/settings/components/data-section';

export function SettingsPage() {
  const [theme, setTheme] = useTheme();
  const user = useAuthStore((s) => s.user);
  const isGuest = useAuthStore((s) => s.isGuest);
  const settings = useSettingsStore();
  const update = useSettingsStore((s) => s.update);
  const exportData = useSettingsStore((s) => s.exportData);
  const clearAllLocalData = useSettingsStore((s) => s.clearAllLocalData);

  const [clearOpen, setClearOpen] = useState(false);
  const [workspaceDraft, setWorkspaceDraft] = useState(settings.workspaceName);
  const [apiKeyDraft, setApiKeyDraft] = useState(settings.openAiApiKey);

  useEffect(() => {
    setWorkspaceDraft(settings.workspaceName);
    setApiKeyDraft(settings.openAiApiKey);
  }, [settings.workspaceName, settings.openAiApiKey]);

  function applyTheme(pref: ThemePreference) {
    update({ theme: pref });
    if (pref === 'system') {
      const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(dark ? 'dark' : 'light');
    } else {
      setTheme(pref);
    }
  }

  function handleExport() {
    const blob = new Blob([exportData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devos-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Настройки</h1>
        <p className="text-sm text-muted-foreground">
          Воркспейс, AI-контекст, интеграции и данные.
        </p>
      </header>

      <WorkspaceSection
        workspaceDraft={workspaceDraft}
        onWorkspaceDraftChange={setWorkspaceDraft}
        onSave={() => update({ workspaceName: workspaceDraft.trim() || 'Мой воркспейс' })}
        userName={user?.name}
        isGuest={isGuest}
      />

      <AppearanceSection
        themePreference={settings.theme}
        currentTheme={theme}
        onThemeChange={applyTheme}
      />

      <AiContextSection
        aiUseDocs={settings.aiUseDocs}
        aiUseTasks={settings.aiUseTasks}
        aiUseGit={settings.aiUseGit}
        aiUseFigma={settings.aiUseFigma}
        apiKeyDraft={apiKeyDraft}
        onToggle={(key, value) => update({ [key]: value })}
        onApiKeyDraftChange={setApiKeyDraft}
        onSaveApiKey={() => update({ openAiApiKey: apiKeyDraft.trim() })}
      />

      <AutosaveSection
        autosaveDelayMs={settings.autosaveDelayMs}
        onChange={(delayMs) => update({ autosaveDelayMs: delayMs })}
      />

      <IntegrationsSection />

      <DataSection onExport={handleExport} onClear={() => setClearOpen(true)} />

      <ConfirmDeleteDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        title="Очистить все данные?"
        description="Проекты, задачи, документация и настройки будут удалены. Вы выйдете из приложения."
        confirmLabel="Очистить"
        onConfirm={clearAllLocalData}
      />
    </div>
  );
}
